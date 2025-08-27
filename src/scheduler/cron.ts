import cron from 'node-cron';
import { WASocket } from '@whiskeysockets/baileys';
import { GeminiAI } from '../ai/gemini.js';
import { buildEnrichedSchedule, DayMap, getOverridesFor, mergeWithOverrides, enrich } from '../storage/loaders.js';
import { getData } from '../storage/files.js';
import { getToday, getDayName, now, addMinutes } from '../utils/time.js';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween.js';
import { logger } from '../utils/logger.js';
import { sendTextMessage } from '../wa/handlers.js';
import { sendSystemTagAll } from '../features/tagAllSystem.js';
import { cronFireGuard } from './fireGuard.js';

dayjs.extend(isBetween);

interface CronParams {
  getSock: () => WASocket | null;
  ai: GeminiAI;
}

function getAllBroadcastGroups(): string[] {
  const wl = getData('whitelist') || { groupAllowed: [] };
  const envG = process.env.GROUP_JID ? [process.env.GROUP_JID] : [];
  const src = [...(wl.groupAllowed || []), ...envG];
  return Array.from(new Set(src.filter((s: string) => typeof s === 'string' && s.endsWith('@g.us'))));
}

export async function initCron({ getSock, ai }: CronParams): Promise<void> {
  const groups = getAllBroadcastGroups();
  
  if (!groups.length) {
    logger.warn('No broadcast groups configured, skipping cron initialization');
    return;
  }

  // 06:00 WIB - Ringkasan jadwal hari ini
  cron.schedule('0 6 * * *', async () => {
    const s = getSock(); if (!s) return;
    for (const g of getAllBroadcastGroups()) {
      await sendDailyScheduleEnriched(s, g);
    }
  }, { 
    timezone: 'Asia/Jakarta' 
  });

  // T-15 menit sebelum kelas - Pengingat kelas
  cron.schedule('*/1 * * * *', async () => {
    const s = getSock(); if (!s) return;
    for (const g of getAllBroadcastGroups()) {
      await checkUpcomingClasses(s, g);
    }
  }, { 
    timezone: 'Asia/Jakarta' 
  });

  // 21:00 WIB - Pengingat barang bawaan besok
  cron.schedule('0 21 * * *', async () => {
    const s = getSock(); if (!s) return;
    for (const g of getAllBroadcastGroups()) {
      await sendCarryItemsReminder(s, g);
    }
  }, { 
    timezone: 'Asia/Jakarta' 
  });

  // 06:00 WIB - Pengingat barang bawaan pagi
  cron.schedule('0 6 * * *', async () => {
    const s = getSock(); if (!s) return;
    for (const g of getAllBroadcastGroups()) {
      await sendCarryItemsReminder(s, g, true);
    }
  }, { 
    timezone: 'Asia/Jakarta' 
  });

  // 19:00 WIB - Minta materi harian dari note takers
  cron.schedule('0 19 * * *', async () => {
    const s = getSock(); if (!s) return;
    await requestDailyMaterials(s);
  }, { 
    timezone: 'Asia/Jakarta' 
  });

  // Hydration reminders (setiap 2 jam dari 08:00-20:00)
  cron.schedule('0 8,10,12,14,16,18,20 * * *', async () => {
    try {
      const dailyGoal = parseInt(process.env.HYDRATION_DAILY_GOAL_ML || '2000');
      const glassSize = parseInt(process.env.HYDRATION_GLASS_SIZE_ML || '250');
      const glassesNeeded = Math.ceil(dailyGoal / glassSize);
      const message = `💧 *PENGINGAT MINUM AIR*\n\n` +
                     `Target hari ini: ${dailyGoal}ml (${glassesNeeded} gelas)\n` +
                     `Ukuran gelas: ${glassSize}ml\n\n` +
                     `Jangan lupa minum air ya! 💪\n` +
                     `Tubuh sehat, pikiran jernih! 🧠✨`;
      const s = getSock(); if (!s) return;
      const cfg = getData('config') || { tagAll: {} };
      for (const g of getAllBroadcastGroups()) {
        if (cfg.tagAll?.hydration) await sendSystemTagAll(() => s, g, message);
        else await sendTextMessage(s, g, message);
      }
    } catch (e) {
      logger.error({ err: e as any }, 'Error in hydration reminder job');
    }
  }, { 
    timezone: 'Asia/Jakarta' 
  });

  logger.info('Cron jobs initialized');
}

function formatDaily(classes: any[], dayName: string): string {
  let msg = `🌅 Ringkasan Hari Ini (${dayName})\n`;
  for (const c of classes) {
    const wa = c.lecturer?.wa ? `https://wa.me/${c.lecturer.wa}` : '-';
    const room = c.room || '-';
    msg += `\n• ${c.start}–${c.end} — ${c.course}\n  Dosen: ${c.lecturer?.name || '-'} (kode ${c.lecturer?.code || '-'})\n  Ruang: ${room}\n  WA: ${wa}\n`;
  }
  return msg;
}

async function sendDailyScheduleEnriched(sock: WASocket, groupJid: string): Promise<void> {
  try {
    const enriched = (getData('enrichedSchedule') || await buildEnrichedSchedule()) as DayMap;
    const today = getToday();
    const dn = getDayName(today);
    const map: any = { mon: 'senin', tue: 'selasa', wed: 'rabu', thu: 'kamis', fri: 'jumat', sat: 'sabtu', sun: 'minggu' };
    const dayName = (dn ? map[String(dn).toLowerCase()] : 'senin');
    const schedule = getData('schedule');
    const dayClasses = ((schedule.days || {}) as any)[dayName] || [];
    const overrides = getOverridesFor(today);
    const merged = mergeWithOverrides(dayClasses, overrides);
    const classes = enrich(merged, enriched);
    if (!classes.length) {
      await sendTextMessage(sock, groupJid, '📅 Hari ini tidak ada jadwal kelas! 😴');
      return;
    }
    const msg = formatDaily(classes, dayName);
    const cfg = getData('config') || { tagAll: {} };
    if (cfg.tagAll?.dailySchedule06) await sendSystemTagAll(() => sock, groupJid, msg);
    else await sendTextMessage(sock, groupJid, msg);
  } catch (error) {
    logger.error({ err: error as any }, 'Error sending daily schedule');
  }
}

async function checkUpcomingClasses(sock: WASocket, groupJid: string): Promise<void> {
  try {
    const currentTime = now();
    const today = getToday();
    const dn2 = getDayName(today);
    const map: any = { mon: 'senin', tue: 'selasa', wed: 'rabu', thu: 'kamis', fri: 'jumat', sat: 'sabtu', sun: 'minggu' };
    const dayName = (dn2 ? map[String(dn2).toLowerCase()] : 'senin');
    const enriched = (getData('enrichedSchedule') || await buildEnrichedSchedule()) as any;
    const schedule = getData('schedule');
    const dayClasses = ((schedule.days || {}) as any)[dayName] || [];
    const overrides = getOverridesFor(today);
    const merged = mergeWithOverrides(dayClasses, overrides);
    const allClasses = enrich(merged, enriched);
    
    for (const cls of allClasses) {
      const classTime = `${today} ${cls.start}`;
      const classStart = dayjs.tz(classTime, 'YYYY-MM-DD HH:mm', 'Asia/Jakarta');
      const fifteenMinutesBefore = classStart.subtract(15, 'minute');
      
      // FIXED: Inklusif check dengan isSame di level minute
      const isTimeToSend = currentTime.isSame(fifteenMinutesBefore, 'minute');
      
      if (isTimeToSend) {
        // FIXED: Idempotency guard - cek dan mark fired
        const signature = cronFireGuard.generateT15Signature(
          today, 
          groupJid, 
          cls.course, 
          cls.start
        );
        
        if (await cronFireGuard.alreadyFired(signature)) {
          // Sudah pernah dikirim hari ini, skip
          continue;
        }
        
        const wa = cls.lecturer?.wa ? `https://wa.me/${cls.lecturer.wa}` : '-';
        const room = cls.room || '-';
        const message = `⏰ 15 menit lagi mulai!\n` +
                        `Matkul : ${cls.course}\n` +
                        `Jam    : ${cls.start}–${cls.end}\n` +
                        `Dosen  : ${cls.lecturer?.name} (kode ${cls.lecturer?.code})\n` +
                        `Ruang  : ${room}\n` +
                        `WA     : ${wa}`;
        
        const cfg = getData('config') || { tagAll: {} };
        if (cfg.tagAll?.tMinus15) await sendSystemTagAll(() => sock, groupJid, message);
        else await sendTextMessage(sock, groupJid, message);
        
        // Mark sebagai sudah fired
        await cronFireGuard.markFired(signature);
        
        logger.info({ 
          signature, 
          course: cls.course, 
          start: cls.start, 
          groupJid 
        }, 'T-15 notification sent');
      }
    }
  } catch (error) {
    logger.error({ err: error as any }, 'Error checking upcoming classes');
  }
}

async function sendCarryItemsReminder(sock: WASocket, groupJid: string, isMorning: boolean = false): Promise<void> {
  try {
    const target = isMorning ? now() : now().add(1, 'day');
    const dn = getDayName(target.format('YYYY-MM-DD'));
    const map: any = { mon: 'senin', tue: 'selasa', wed: 'rabu', thu: 'kamis', fri: 'jumat', sat: 'sabtu', sun: 'minggu' };
    const dayName = (dn ? map[String(dn).toLowerCase()] : 'senin');
    const schedule = getData('schedule');
    const items = getData('items');
    
    const daySchedule = (schedule.days as any)[dayName] || [];
    const overrides = schedule.overrides.filter((o: any) => o.date === target.format('YYYY-MM-DD'));
    // Avoid duplicates when override exists
    const allClasses = [
      ...overrides,
      ...daySchedule.filter((cls: any) => !overrides.find((o: any) => o.course === cls.course))
    ];
    
    if (allClasses.length === 0) {
      return; // No classes tomorrow
    }
    
    const timePrefix = isMorning ? '🌅 PAGI' : '🌙 MALAM';
    let message = `📦 *PENGINGAT BARANG BAWAAN* (${timePrefix})\n\n`;
    message += `${isMorning ? 'Untuk hari ini' : 'Untuk besok'} (${dayName}):\n\n`;
    
    const listed = new Set<string>();
    for (const cls of allClasses) {
      if (listed.has(cls.course)) continue;
      listed.add(cls.course);
      const courseItemList = items[cls.course] || [];
      if (courseItemList.length > 0) {
        message += `📚 *${cls.course}*\n`;
        courseItemList.forEach((item: string) => {
          message += `   • ${item}\n`;
        });
        message += '\n';
      }
    }
    
    if (message.includes('•')) {
      const cfg = getData('config') || { tagAll: {} };
      const key = isMorning ? 'carryItemsMorning' : 'carryItemsNight';
      if (cfg.tagAll?.[key]) await sendSystemTagAll(() => sock, groupJid, message);
      else await sendTextMessage(sock, groupJid, message);
    }
  } catch (error) {
    logger.error({ err: error as any }, 'Error sending carry items reminder');
  }
}

async function requestDailyMaterials(sock: WASocket): Promise<void> {
  try {
    const noteTakers = process.env.NOTE_TAKERS?.split(',') || [];
    
    if (noteTakers.length === 0) {
      logger.warn('No note takers configured');
      return;
    }
    
    const message = `📝 *KOLEKSI MATERI HARIAN*\n\n` +
                   `Halo! Hari ini belajar apa aja? 📚\n\n` +
                   `Tolong kirim:\n` +
                   `• Foto papan tulis 📸\n` +
                   `• File PPT/PDF 📄\n` +
                   `• Link materi 🔗\n` +
                   `• Atau catatan lainnya 📝\n\n` +
                   `Kirim satu-satu ya, dengan caption singkat untuk setiap item! 😊`;

    for (const jid of noteTakers) {
      try {
        await sendTextMessage(sock, jid, message);
        logger.info(`Daily materials request sent to ${jid}`);
      } catch (error) {
        logger.error({ err: error as any, jid }, 'Error sending daily materials request');
      }
    }
  } catch (error) {
    logger.error({ err: error as any }, 'Error requesting daily materials');
  }
}