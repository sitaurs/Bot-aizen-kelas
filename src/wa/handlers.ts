import { WASocket, proto } from '@whiskeysockets/baileys';
import { downloadMediaMessage } from '@whiskeysockets/baileys';
import { logger } from '../utils/logger.js';
import { fuzzyTrigger } from '../features/fuzzy-trigger.js';
// import { handleMentionAll } from '../features/mentions.js';
import { handleTagAll } from '../features/tagAll.js';
import { buildIntroMessage } from '../features/intro.js';
import { sendSystemTagAll } from '../features/tagAllSystem.js';
import { getData, saveData } from '../storage/files.js';
import { GeminiAI } from '../ai/gemini.js'; // GEMINI-FIRST: Direct import
import { saveIncomingMedia } from '../features/materials.js';
import { isBroadcastCommand, extractBroadcastMessage, broadcastToAllGroups } from '../features/broadcast.js';
import { WhatsAppMessage } from '../types/index.js';
import { isAllowedChat, getPersonByJid, getFunRoleByJid } from '../utils/access.js';
import { maybeAppendQuote } from '../utils/quotes.js';
import { reactStage, withPresence } from '../ux/progress.js';
import { sendTextSmart } from '../ux/format.js';
import { normalizeJid, isGroupJid } from '../utils/jid.js';
import { validateMentionAllAccess } from '../utils/gating.js';
import { getToday, getDayName } from '../utils/time.js';

/**
 * Handle material submission from Note Takers
 * Format: <ID> <link> <caption>
 */
async function handleNoteTakersSubmission(sock: WASocket, msg: WhatsAppMessage, text: string | null, senderJid: string): Promise<boolean> {
  try {
    // Check if sender is a note taker and this is a DM
    const noteTakers = process.env.NOTE_TAKERS?.split(',') || [];
    if (!text || !senderJid.endsWith('@s.whatsapp.net') || !noteTakers.includes(senderJid)) {
      return false;
    }
    
    // Parse input with format: <id> <link> <caption>
    const match = text.match(/^(\d+)\s+(https?:\/\/\S+)\s+(.+)$/s);
    if (!match) {
      return false;
    }
    
    const [, idStr, link, caption] = match;
    if (!idStr || !link || !caption) {
      return false;
    }
    
    const id = parseInt(idStr, 10);
    
    if (id < 1) {
      await sendTextSmart(sock, senderJid, '❌ ID mata kuliah harus angka 1 atau lebih besar.');
      return true;
    }
    
    // Get today's courses for validation (optional, allow any ID)
    const today = getToday();
    const dn = getDayName(today);
    const map: any = { mon: 'senin', tue: 'selasa', wed: 'rabu', thu: 'kamis', fri: 'jumat', sat: 'sabtu', sun: 'minggu' };
    const dayName = (dn ? map[String(dn).toLowerCase()] : 'senin');
    const schedule = getData('schedule');
    const dayClasses = ((schedule.days || {}) as any)[dayName] || [];
    
    let courseName = `Mata Kuliah ID-${id}`;
    if (id <= dayClasses.length) {
      courseName = dayClasses[id - 1].course;
    }
    
    // Save material to JSON
    const materials = getData('materials') || { byDate: {}, byCourse: {} };
    const dateKey = today;
    
    if (!materials.byDate[dateKey]) {
      materials.byDate[dateKey] = [];
    }
    
    if (!materials.byCourse[courseName]) {
      materials.byCourse[courseName] = [];
    }
    
    const newMaterial = {
      id: `mat_${Date.now()}`,
      date: today,
      course: courseName,
      link: link,
      caption: caption,
      type: 'link',
      addedBy: senderJid,
      timestamp: new Date().toISOString()
    };
    
    materials.byDate[dateKey].push(newMaterial);
    materials.byCourse[courseName].push(newMaterial);
    
    await saveData('materials', materials);
    
    // Send confirmation
    await sendTextSmart(sock, senderJid, 
      `✅ *MATERI TERSIMPAN!*\n\n` +
      `📚 **Mata Kuliah:** ${courseName}\n` +
      `🔗 **Link:** ${link}\n` +
      `📝 **Caption:** ${caption}\n\n` +
      `Material ini sekarang bisa dicari dengan kata kunci dari caption. Terima kasih! 🙏`
    );
    
    logger.info({ senderJid, course: courseName, id }, 'Note taker material saved');
    return true;
    
  } catch (error) {
    logger.error({ err: error as any, senderJid }, 'Error handling note taker submission');
    await sendTextSmart(sock, senderJid, '❌ Terjadi kesalahan saat menyimpan materi. Silakan coba lagi.');
    return true;
  }
}

interface MessageUpsertParams {
  sock: WASocket;
  upsert: {
    messages: WhatsAppMessage[];
    type: 'notify' | 'append';
  };
}

export async function onMessageUpsert({ sock, upsert }: MessageUpsertParams): Promise<void> {
  const msg = upsert.messages?.[0];
  
  if (!msg?.message || msg.key.fromMe) {
    logger.debug('Skipping: no message or from self');
    return;
  }

  const jid = normalizeJid(msg.key.remoteJid!);
  const text = extractText(msg);

  logger.info(`[HANDLER] Received message from ${jid}: "${text?.slice(0, 50)}..."`);

  // !idg is allowed everywhere (bypass allowlist)
  if (String(text || '').trim() === '!idg') {
    logger.info('[HANDLER] Processing !idg command');
    const isGroup = isGroupJid(jid);
    const lines = [
      `ID: ${jid}`,
      isGroup ? 'Tipe: Grup (@g.us)' : 'Tipe: DM (@s.whatsapp.net/@lid)',
      isGroup ? 'Tambahkan ke data/whitelist.json → groupAllowed[]' : 'Untuk DM, tambahkan ke dmAllowed[] (tanpa suffix @s.whatsapp.net)'
    ];
    
    try {
      await sendTextSmart(sock, jid, lines.join('\n'));
      logger.info('[HANDLER] !idg response sent successfully');
      await reactStage(sock, jid, msg.key as any, 'done');
    } catch (error) {
      logger.error({ err: error, jid }, '[HANDLER] Failed to send !idg response');
    }
    return;
  }

  // Access control: ignore messages outside allowed groups/DMs
  if (!isAllowedChat(jid)) {
    logger.debug(`[HANDLER] Message from ${jid} blocked by access control`);
    return;
  }
  
  if (!text) {
    logger.info(`[HANDLER] Processing media message from ${jid}`);
    // Handle media messages
    await handleMediaMessage(sock, msg, jid);
    return;
  }

  const person = getPersonByJid(jid);
  logger.info(`[HANDLER] Text message from ${jid}${person ? ` (${person.name})` : ''}: ${text}`);

  // Early bypass: Note Takers material submission
  const noteTakersHandled = await handleNoteTakersSubmission(sock, msg as any, text, jid);
  if (noteTakersHandled) {
    logger.info(`[HANDLER] Message handled by note takers system`);
    return;
  }

  // Early bypass: Broadcast command (cht <message>)
  if (isBroadcastCommand(text)) {
    logger.info(`[HANDLER] Processing broadcast command from ${jid}`);
    try {
      const broadcastMessage = extractBroadcastMessage(text);
      if (!broadcastMessage.trim()) {
        await sendTextSmart(sock, jid, '❌ Pesan broadcast tidak boleh kosong!\n\nFormat: `cht <pesan>`');
        return;
      }
      
      await reactStage(sock, jid, msg.key as any, 'sending');
      await broadcastToAllGroups(sock, broadcastMessage);
      await sendTextSmart(sock, jid, `✅ Pesan berhasil di-broadcast ke semua grup!\n\n📢 **Pesan:** ${broadcastMessage}`);
      await reactStage(sock, jid, msg.key as any, 'done');
      logger.info(`[HANDLER] Broadcast completed successfully from ${jid}`);
    } catch (error) {
      logger.error({ err: error, jid }, '[HANDLER] Failed to process broadcast command');
      await sendTextSmart(sock, jid, '❌ Gagal mengirim broadcast. Silakan coba lagi.');
    }
    return;
  }

  // Early bypass: @ll trigger without Gemini
  const tagAllHandled = await handleTagAll(sock, msg as any, String(text || '').trim(), { 
    isAllowedByRoles: (senderJid: string, groupJid: string) => validateMentionAllAccess(senderJid).allowed, 
    rateLimitMs: 2*60*1000, 
    batchSize: 80 
  });
  
  if (tagAllHandled) {
    logger.info(`[HANDLER] Message handled by tagAll bypass`);
    return;
  }

  // Early bypass: !intro (no Gemini)
  if (String(text || '').trim() === '!intro') {
    logger.info(`[HANDLER] Processing !intro command`);
    try {
      const intro = await buildIntroMessage();
      const cfg = getData('config') || { tagAll: {} };
      if (isGroupJid(jid) && cfg.tagAll?.intro) {
        await sendSystemTagAll(() => sock, jid, intro);
      } else {
        await sendTextSmart(sock, jid, intro);
      }
      logger.info(`[HANDLER] !intro response sent successfully`);
      await reactStage(sock, jid, msg.key as any, 'done');
    } catch (error) {
      logger.error({ err: error, jid }, '[HANDLER] Failed to send !intro response');
    }
    return;
  }

  // Early bypass: Developer eval commands (> / <)
  const trimmedText = String(text || '').trim();
  if ((trimmedText.startsWith('>') || trimmedText.startsWith('<')) && 
      process.env.ALLOW_EVAL === '1') {
    // Only allow if user has developer access - check via roles
    try {
      const person = getPersonByJid(jid);
      if (person?.roles?.includes('developer')) {
        logger.warn({ jid, command: trimmedText.slice(0, 20) }, '[HANDLER] Developer eval command bypassed');
        return; // Actually bypass by returning early
      }
    } catch {
      // If no permission, continue to normal flow
    }
  }

  // GEMINI-FIRST: All other messages go through Gemini
  const shouldTrigger = fuzzyTrigger(text);
  logger.info(`[HANDLER] Fuzzy trigger result for "${text}": ${shouldTrigger}`);
  
  if (shouldTrigger) {
    logger.info(`[HANDLER] Starting Gemini processing pipeline`);
    
    try { 
      await reactStage(sock, jid, msg.key as any, 'waiting'); 
      logger.debug(`[HANDLER] Set reaction to waiting`);
    } catch (error) {
      logger.warn({ err: error }, '[HANDLER] Failed to set waiting reaction');
    }
    
    try {
      const reply = await withPresence(sock, jid, async () => {
        try { 
          await reactStage(sock, jid, msg.key as any, 'composing'); 
          logger.debug(`[HANDLER] Set reaction to composing`);
        } catch (error) {
          logger.warn({ err: error }, '[HANDLER] Failed to set composing reaction');
        }
        
        // GEMINI-FIRST: Direct Gemini AI processing
        logger.info(`[HANDLER] Initializing Gemini AI`);
        const ai = new GeminiAI();
        ai.setRequesterJid(msg.key.participant || jid);
        ai.setChatJid(jid);
        
        try {
          logger.info(`[HANDLER] Calling Gemini chatAndAct`);
          const geminiResponse = await ai.chatAndAct(text);
          logger.info(`[HANDLER] Gemini response received: ${typeof geminiResponse} (${String(geminiResponse).slice(0, 100)}...)`);
          return geminiResponse;
        } catch (error) {
          logger.error({ err: error as any, jid, text: text.slice(0, 100) }, '[HANDLER] Gemini chatAndAct failed');
          
          // Fallback for Gemini failures - return friendly error without heuristic execution
          const errorMessage = String(error || '');
          if (/429|quota/i.test(errorMessage)) {
            return '⚠️ Maaf, modul AI sedang sibuk. Coba lagi dalam beberapa saat.';
          } else if (/5\d\d|timeout|network|fetch failed|ENOTFOUND|ECONNRESET/i.test(errorMessage)) {
            return '⚠️ Maaf, modul AI sedang bermasalah. Coba lagi nanti.';
          }
          return '⚠️ Maaf, terjadi kesalahan dalam memproses permintaan Anda.';
        }
      });
      
      logger.info(`[HANDLER] Processing reply for final send`);
      const person = getPersonByJid(jid);
      const withGreeting = person ? `Oke *${person.name}* 👋\n\n${reply}` : reply;
      const funRole = getFunRoleByJid(jid);
      const finalText = maybeAppendQuote(jid, withGreeting, funRole === 'anak_nakal');
      
      try { 
        await reactStage(sock, jid, msg.key as any, 'sending'); 
        logger.debug(`[HANDLER] Set reaction to sending`);
      } catch (error) {
        logger.warn({ err: error }, '[HANDLER] Failed to set sending reaction');
      }
      
      logger.info(`[HANDLER] Sending final response`);
      await sendTextSmart(sock, jid, finalText);
      logger.info(`[HANDLER] Response sent successfully`);
      
      try { 
        await reactStage(sock, jid, msg.key as any, 'done'); 
        logger.debug(`[HANDLER] Set reaction to done`);
      } catch (error) {
        logger.warn({ err: error }, '[HANDLER] Failed to set done reaction');
      }
      
    } catch (error) {
      logger.error({ err: error as any, jid, text }, '[HANDLER] Full pipeline failed');
      
      try {
        await reactStage(sock, jid, msg.key as any, 'error');
        await sendTextSmart(sock, jid, '⚠️ Maaf, terjadi kesalahan sistem. Coba lagi nanti.');
      } catch (fallbackError) {
        logger.error({ err: fallbackError }, '[HANDLER] Even fallback failed');
      }
    }
  } else {
    logger.info(`[HANDLER] Message "${text}" did not trigger fuzzy matcher - no response`);
  }
}

function extractText(msg: WhatsAppMessage): string | null {
  const message = msg.message;
  
  if (message.conversation) {
    return message.conversation;
  }
  
  if (message.extendedTextMessage) {
    return message.extendedTextMessage.text;
  }
  
  if (message.imageMessage?.caption) {
    return message.imageMessage.caption;
  }
  
  if (message.videoMessage?.caption) {
    return message.videoMessage.caption;
  }
  
  if (message.documentMessage?.caption) {
    return message.documentMessage.caption;
  }
  
  return null;
}

async function handleMediaMessage(sock: WASocket, msg: WhatsAppMessage, jid: string): Promise<void> {
  try {
    const message = msg.message;
    let mediaType: string | null = null;
    let filename: string | null = null;
    let caption: string | null = null;

    if (message.imageMessage) {
      mediaType = 'image';
      filename = message.imageMessage.fileName || `image_${Date.now()}.jpg`;
      caption = message.imageMessage.caption || null;
    } else if (message.videoMessage) {
      mediaType = 'video';
      filename = message.videoMessage.fileName || `video_${Date.now()}.mp4`;
      caption = message.videoMessage.caption || null;
    } else if (message.documentMessage) {
      mediaType = 'document';
      filename = message.documentMessage.fileName || `document_${Date.now()}`;
      caption = message.documentMessage.caption || null;
    } else if (message.audioMessage) {
      mediaType = 'audio';
      filename = `audio_${Date.now()}.ogg`;
    }

    if (mediaType) {
      logger.info(`Received ${mediaType} from ${jid}`);
      
      // Download and save media
      const buffer = await downloadMediaMessage(msg, 'buffer', {}, {
        reuploadRequest: sock.updateMediaMessage,
        logger: (console as any) // Baileys expects an ILogger; for simplicity use console
      } as any);

      // Save to materials if it's from a note taker
      const noteTakers = process.env.NOTE_TAKERS?.split(',') || [];
      if (noteTakers.includes(jid)) {
        await saveIncomingMedia({
          sock,
          msg,
          buffer,
          filename: filename || `file_${Date.now()}`,
          caption,
          mediaType
        });
        
        await sock.sendMessage(jid, { 
          text: `✅ Materi berhasil disimpan! ${caption ? `\nCaption: ${caption}` : ''}` 
        });
      }
    }
  } catch (error) {
    logger.error({ err: error as any }, 'Error handling media message');
  }
}

export async function sendMessage(sock: WASocket, jid: string, content: any): Promise<void> {
  try {
    await sock.sendMessage(jid, content);
  } catch (error) {
    logger.error({ err: error as any, jid, contentType: Object.keys(content)[0] }, 'Error sending message');
  }
}

export async function sendTextMessage(sock: WASocket, jid: string, text: string): Promise<void> {
  await sendMessage(sock, jid, { text });
}

export async function sendMediaMessage(
  sock: WASocket, 
  jid: string, 
  filePath: string, 
  caption?: string,
  type: 'image' | 'video' | 'document' = 'document'
): Promise<void> {
  try {
    const fs = await import('fs/promises');
    const buffer = await fs.readFile(filePath);
    
    let message: any = {};
    
    switch (type) {
      case 'image':
        message = {
          image: buffer,
          caption: caption || ''
        };
        break;
      case 'video':
        message = {
          video: buffer,
          caption: caption || ''
        };
        break;
      case 'document':
        message = {
          document: buffer,
          fileName: filePath.split('/').pop() || 'document',
          caption: caption || ''
        };
        break;
    }
    
    await sendMessage(sock, jid, message);
  } catch (error) {
    logger.error({ err: error as any, jid, filePath, type }, 'Error sending media message');
  }
}
