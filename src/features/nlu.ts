import { WASocket } from '@whiskeysockets/baileys';
import { GeminiAI } from '../ai/gemini.js';
import { getData, saveData } from '../storage/files.js';
import { cleanTriggerFromText } from './fuzzy-trigger.js';
import { logger } from '../utils/logger.js';
import { WhatsAppMessage } from '../types/index.js';
import { handleToolCall } from '../ai/tools.js';
import { normalizeRelativeDate } from '../utils/time.js';
// Pre-router disabled to return to LLM-led flow

const ai = new GeminiAI();

interface AIClarifyOrActParams {
  sock: WASocket;
  msg: WhatsAppMessage;
  text: string;
}

type Pending = {
  intent: string;
  args: Record<string, any>;
  expect?: string[];
  history?: any[];
  expiresAt: number;
};

function looksLikeSmalltalk(text: string): boolean {
  const t = String(text || '').toLowerCase();
  return /(halo|hai|hello|ass?alam|apa kabar|kabar|pagi|siang|sore|malam|terima kasih|makasih|thanks|wkwk|hehe|lol)/i.test(t);
}

export async function aiClarifyOrAct({ sock, msg, text }: AIClarifyOrActParams): Promise<string> {
  const jid = msg.key.remoteJid!;
  const sender = msg.key.participant || jid;
  const cleanText = cleanTriggerFromText(text);
  
  try {
    const context = getData('context') || {};
    const key = `${jid}:${sender}`;
    const chatContext = context[key];
    if (/\b(batal|cancel|reset)\b/i.test(cleanText)) {
      await updateContext(jid, null);
      return 'Siap, mulai dari awal.';
    }
    // Do not force pre-routing; let Gemini decide tools. No schedule fast-paths.
    // Get context for this chat (refreshed if cleared above)
    const ctx2 = getData('context') || {};
    const chatContext2 = ctx2[key];
    
    const nowTs = Date.now();
    const pending: Pending | null = chatContext2?.pendingAction || null;
    if (pending && pending.expiresAt > nowTs) {
      // If this is smalltalk/greeting, bypass pending and go to Gemini
      if (looksLikeSmalltalk(cleanText)) {
        await updateContext(jid, null, sender);
        const response = await ai.chatAndAct(cleanText, chatContext2?.lastMessage);
        return response;
      }
      const result = await tryCompletePendingAction(cleanText, pending, jid);
      if (result.completed) {
        await updateContext(jid, null, sender);
        return result.response;
      } else {
        return result.response;
      }
    } else if (pending && pending.expiresAt <= nowTs) {
      await updateContext(jid, null, sender);
    }
    
    // Process new request
    const inferred = inferPendingAction(cleanText);
    if (inferred.type !== 'clarification' && inferred.expect && inferred.expect.length) {
      const question = buildClarifyQuestion(inferred.type, inferred.expect);
      const expiresAt = Date.now() + 30 * 60 * 1000; // 30 minutes
      await updateContext(jid, {
        intent: inferred.type,
        args: { originalText: cleanText },
        expect: inferred.expect,
        history: [],
        expiresAt
      }, sender);
      return question;
    }
    
    ai.setRequesterJid(sender);
    ai.setChatJid(jid);
    const response = await ai.chatAndAct(cleanText, chatContext?.lastMessage);
    
    if (needsClarification(response)) {
      const inf = inferPendingAction(cleanText);
      const question = buildClarifyQuestion(inf.type, inf.expect);
      const expiresAt = Date.now() + 30 * 60 * 1000;
      await updateContext(jid, {
        intent: inf.type,
        args: { originalText: cleanText },
        expect: inf.expect,
        history: [],
        expiresAt
      }, sender);
      return question;
    }
    
    return response;
  } catch (error) {
    logger.error({ err: error as any }, 'Error in AI clarify or act');
    return 'Maaf, terjadi kesalahan dalam memproses permintaan Anda.';
  }
}

function needsClarification(response: string): boolean {
  const clarificationKeywords = [
    'jam berapa',
    'tanggal berapa',
    'mata kuliah apa',
    'ruangan mana',
    'kapan',
    'dimana',
    'siapa',
    'berapa',
    'tolong jelaskan',
    'bisa dijelaskan',
    'mohon konfirmasi'
  ];
  
  const lowerResponse = response.toLowerCase();
  return clarificationKeywords.some(keyword => lowerResponse.includes(keyword));
}

function inferPendingAction(text: string): { type: string; expect: string[] } {
  const t = text.toLowerCase();
  // naive heuristics
  if (/ubah|pindah|ganti/.test(t) && /jadwal/.test(t)) {
    return { type: 'changeSchedule', expect: ['course', 'date', 'start', 'end', 'room?'] };
  }
  if (/set|tambah/.test(t) && /reminder|pengingat/.test(t)) {
    return { type: 'setReminder', expect: ['type', 'title', 'dueISO', 'course?'] };
  }
  if (/hapus/.test(t) && /ujian|uts|uas/.test(t)) {
    return { type: 'deleteExam', expect: ['id?'] };
  }
  if (/hapus/.test(t) && /kas/.test(t)) {
    return { type: 'deleteCashReminder', expect: ['id?'] };
  }
  if (/dimana|lokasi/.test(t)) {
    return { type: 'getClassLocation', expect: ['course', 'date?'] };
  }
  // FIXED RC-20250827: Hapus pre-clarify untuk jadwal, biarkan LLM handle via getScheduleByDay/getWeeklySchedule
  // if (/jadwal/.test(t)) {
  //   return { type: 'getSchedule', expect: ['date?'] };
  // }
  return { type: 'clarification', expect: [] };
}

function buildClarifyQuestion(intent: string, expect: string[] = []): string {
  if (intent === 'changeSchedule') {
    if (expect.includes('course')) return 'Mata kuliahnya apa?';
    if (expect.includes('date')) return 'Untuk hari/tanggal kapan? (contoh: besok atau 2025-09-01)';
    if (expect.includes('start') || expect.includes('end')) return 'Jam mulai dan selesai berapa? (contoh: 08:00-10:00)';
    if (expect.includes('room?')) return 'Ruangnya di mana? (opsional)';
  }
  if (intent === 'setReminder') {
    if (expect.includes('title')) return 'Judul pengingatnya apa?';
    if (expect.includes('dueISO')) return 'Tanggal & jamnya kapan? (contoh: 2025-09-01 17:00)';
  }
  if (intent === 'getClassLocation') return 'Mata kuliahnya apa?';
  // FIXED RC-20250827: Remove getSchedule clarification - let LLM handle directly
  // if (intent === 'getSchedule') return 'Untuk hari/tanggal apa? (contoh: hari ini/besok/Rabu)';
  return 'Boleh dilengkapi satu detail paling penting dulu?';
}

async function tryCompletePendingAction(text: string, pendingAction: Pending, requesterJid: string): Promise<{ completed: boolean; response: string }> {
  try {
    const extractedInfo = extractInfoFromText(text, pendingAction.intent, pendingAction.expect);
    if (extractedInfo.complete) {
      const completeParams = { ...pendingAction.args, ...extractedInfo.data, _requesterJid: requesterJid };
      try {
        const result = await handleToolCall({ name: pendingAction.intent, args: completeParams });
        return { completed: true, response: formatConfirmation(pendingAction.intent, result) };
      } catch (e: any) {
        return { completed: false, response: 'Maaf, eksekusi gagal. Coba ulangi.' };
      }
    } else {
      return { completed: false, response: extractedInfo.prompt || 'Bisa sebutkan detailnya lagi, ya?' };
    }
  } catch (error) {
    logger.error({ err: error as any }, 'Error completing pending action');
    return { completed: false, response: 'Maaf, terjadi kesalahan. Bisa diulang lagi?' };
  }
}

function extractInfoFromText(text: string, actionType: string, expect: string[] = []): { complete: boolean; data: any; prompt?: string } {
  const lowerText = text.toLowerCase();
  
  switch (actionType) {
    case 'changeSchedule':
      const timeRange = text.match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/);
      const dayWord = text.match(/(hari ini|besok|lusa|senin|selasa|rabu|kamis|jumat|sabtu|minggu)/i);
      const roomMatch = text.match(/di\s+([A-Za-z0-9_.-]+)/i);
      const dateISO = dayWord ? normalizeRelativeDate(dayWord[1]!.toLowerCase()) : null;
      const data: any = {};
      if (timeRange) { data.start = timeRange[1]; data.end = timeRange[2]; }
      if (dateISO) { data.date = dateISO; }
      if (roomMatch) { data.room = roomMatch[1]; }
      const haveAll = ['course','date','start','end'].every(k => (k === 'course' ? !!data.course : !!data[k]));
      return haveAll ? { complete: true, data } : { complete: false, data, prompt: buildClarifyQuestion('changeSchedule', expect) };
    
    case 'setReminder':
      const dateTimeMatch = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s*(\d{1,2}):(\d{2})/);
      if (dateTimeMatch) {
        return {
          complete: true,
          data: {
            dueISO: `${dateTimeMatch[3]}-${dateTimeMatch[2]}-${dateTimeMatch[1]}T${dateTimeMatch[4]}:${dateTimeMatch[5]}:00`
          }
        };
      }
      break;
  }
  
  return {
    complete: false,
    data: {},
    prompt: expect && expect.length
      ? `Butuh info: ${expect.join(', ')}. Bisa dilengkapi?`
      : 'Maaf, saya tidak mengerti. Bisa dijelaskan lebih detail?'
  };
}

function formatConfirmation(intent: string, result: any): string {
  if (intent === 'changeSchedule' && result?.success) return '✅ Jadwal berhasil diperbarui.';
  if (intent === 'setReminder' && result?.success) return '✅ Pengingat berhasil ditambahkan.';
  if (intent === 'deleteExam' && result?.success) return '✅ Ujian berhasil dihapus.';
  return typeof result === 'string' ? result : '✅ Berhasil.';
}

async function updateContext(jid: string, pendingAction: Pending | null, sender?: string): Promise<void> {
  const context = getData('context') || {};
  const now = Date.now();
  const key = sender ? `${jid}:${sender}` : jid;
  context[key] = {
    jid,
    lastMessage: pendingAction?.args?.originalText || '',
    pendingAction,
    timestamp: now
  };
  const oneHourAgo = now - (60 * 60 * 1000);
  Object.keys(context).forEach(key => {
    if (context[key].timestamp < oneHourAgo) {
      delete context[key];
    }
  });
  await saveData('context', context);
}
