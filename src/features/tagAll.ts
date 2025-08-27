import { WASocket } from '@whiskeysockets/baileys';
import { logger } from '../utils/logger.js';
import { TAG_ALL_RATE_LIMIT_MS, TAG_ALL_BATCH_SIZE, TAG_ALL_ADMIN_ONLY } from '../config/tagAll.js';
import { isGroupJid, normalizeJid } from '../utils/jid.js';

const groupCooldownAt = new Map<string, number>();

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export async function handleTagAll(
  sock: WASocket,
  msg: any,
  text: string,
  opts?: {
    isAllowedByRoles: (senderJid: string, groupJid: string) => Promise<boolean> | boolean,
    allowAdminsOnly?: boolean,
    rateLimitMs?: number,
    batchSize?: number
  }
): Promise<boolean> {
  try {
    const jid = normalizeJid(msg?.key?.remoteJid);
    if (!jid || !isGroupJid(jid)) return false; // only groups
    const m = text.match(/^@ll(?:\s+(.*))?$/i);
    if (!m) return false;

    const payload = (m[1] || '').trim() || 'Ping semua anggota';
    const sender = normalizeJid(msg?.key?.participant || msg?.key?.remoteJid);
    const allowAdminsOnly = opts?.allowAdminsOnly ?? TAG_ALL_ADMIN_ONLY;
    const rateLimitMs = opts?.rateLimitMs ?? TAG_ALL_RATE_LIMIT_MS;
    const batchSize = opts?.batchSize ?? TAG_ALL_BATCH_SIZE;

    // Role gating
    if (opts?.isAllowedByRoles) {
      const ok = await opts.isAllowedByRoles(sender, jid);
      if (!ok) {
        await sock.sendMessage(jid, { text: '🙅‍♀️ Maaf, kamu tidak diizinkan menggunakan @ll.' }, { quoted: msg });
        return true;
      }
    }

    // Cooldown per group
    const now = Date.now();
    const last = groupCooldownAt.get(jid) || 0;
    if (now - last < rateLimitMs) {
      await sock.sendMessage(jid, { text: '⏳ Tag-all masih cooldown…' }, { quoted: msg });
      logger.info({ groupJid: jid }, 'tagall.cooldown');
      return true;
    }

    // Metadata
    const meta = await sock.groupMetadata(jid);
    const participants: string[] = (meta?.participants || []).map((p: any) => p.id || p.jid || p.userJid).filter(Boolean);

    // Exclude bot itself if known
    const meBase = (sock.user?.id || '').split(':')[0] || '';
    const mentions = participants.filter(p => (meBase ? !p.startsWith(meBase) : true));

    // Optional: admin-only
    if (allowAdminsOnly) {
      const senderEntry = (meta?.participants || []).find((p: any) => (p.id || p.jid || p.userJid) === sender);
      const isAdmin = !!(senderEntry?.isAdmin || senderEntry?.isSuperAdmin || senderEntry?.admin);
      if (!isAdmin) {
        await sock.sendMessage(jid, { text: '🙅‍♂️ @ll hanya untuk admin grup.' }, { quoted: msg });
        return true;
      }
    }

    // Chunking
    const batches = chunk(mentions, batchSize);
    for (let i = 0; i < batches.length; i++) {
      const suffix = batches.length > 1 ? ` (lanjutan ${i + 1}/${batches.length})` : '';
      const textOut = i === 0 ? payload : `…${suffix}`;
      await sock.sendMessage(jid, { text: textOut, contextInfo: { mentionedJid: (batches[i] || null) as any } }, { quoted: msg });
    }

    groupCooldownAt.set(jid, now);
    logger.info({ groupJid: jid, count: mentions.length, batches: batches.length }, 'tagall.sent');
    return true;
  } catch (error) {
    logger.error({ err: error as any }, 'tagall.error');
    return false;
  }
}


