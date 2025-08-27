import type { WASocket } from '@whiskeysockets/baileys';
import { logger } from '../utils/logger.js';
import { getData } from '../storage/files.js';

type GetSock = () => WASocket | null;

type CacheEntry<T> = { value: T; expiresAt: number };
const metaCache = new Map<string, CacheEntry<any>>();
const cooldownMap = new Map<string, number>();

async function getCachedGroupMeta(sock: WASocket, jid: string, ttlSec = 300): Promise<any> {
  const now = Date.now();
  const hit = metaCache.get(jid);
  if (hit && hit.expiresAt > now) return hit.value;
  const meta = await sock.groupMetadata(jid);
  metaCache.set(jid, { value: meta, expiresAt: now + ttlSec * 1000 });
  return meta;
}

export async function getGroupMentions(sock: WASocket, jid: string): Promise<string[]> {
  const meta = await getCachedGroupMeta(sock, jid);
  const self = (sock.user?.id || '').replace(/:.+$/, '');
  return (meta.participants || [])
    .map((p: any) => p.id || p.jid || p.userJid)
    .filter(Boolean)
    .filter((j: string) => !j.startsWith(self || ''));
}

function chunk<T>(arr: T[], size: number) {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));
}

export async function sendSystemTagAll(
  getSock: GetSock,
  chatJid: string,
  text: string,
  opts?: { chunkSize?: number; cooldownSec?: number; quoted?: any }
) {
  const sock = getSock();
  if (!sock) return;
  if (!chatJid.endsWith('@g.us')) { await sock.sendMessage(chatJid, { text }, { quoted: opts?.quoted }); return; }
  const cfg = (getData('config') || { tagAll: {} }).tagAll || {};
  const chunkSize = opts?.chunkSize ?? cfg.chunkSize ?? 80;
  const cooldown = (opts?.cooldownSec ?? cfg.cooldownSeconds ?? 120) * 1000;
  const key = `sys_cd:${chatJid}`;
  const now = Date.now();
  const prev = cooldownMap.get(key) || 0;
  if (now - prev < cooldown) { logger.info({ chatJid }, 'systemTagAll.cooldown'); return; }
  const mentions = await getGroupMentions(sock, chatJid);
  const batches = chunk(mentions, chunkSize);
  for (const m of batches) {
    await sock.sendMessage(chatJid, { text, contextInfo: { mentionedJid: m } }, { quoted: opts?.quoted });
  }
  cooldownMap.set(key, now);
  logger.info({ chatJid, batches: batches.length }, 'systemTagAll.sent');
}


