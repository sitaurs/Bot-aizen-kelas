import { WASocket } from '@whiskeysockets/baileys';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import { Reminder } from './ure.types.js';
import { getData } from '../storage/files.js';
import { sendSystemTagAll } from '../features/tagAllSystem.js';
import { loadReminders, updateReminders } from './ure.store.js';
import { logger } from '../utils/logger.js';

dayjs.extend(utc); dayjs.extend(timezone); dayjs.tz.setDefault('Asia/Jakarta');

let timer: NodeJS.Timer | undefined;
const fireGuard = new Map<string, number>();

function parseRRule(rrule: string): { byDay?: string[] | undefined; byHour?: number | undefined; byMinute?: number | undefined; freq?: string | undefined } {
  const parts = Object.fromEntries(rrule.split(';').map(kv => kv.split('=')));
  const byDay = parts['BYDAY'] ? String(parts['BYDAY']).split(',') : undefined;
  const byHour = parts['BYHOUR'] ? parseInt(parts['BYHOUR'], 10) : undefined;
  const byMinute = parts['BYMINUTE'] ? parseInt(parts['BYMINUTE'], 10) : undefined;
  const freq = parts['FREQ'];
  return { byDay, byHour, byMinute, freq };
}

function isDue(r: Reminder, now: dayjs.Dayjs): boolean {
  if (r.status !== 'active') return false;
  if (!r.nextRunAt) return false;
  const next = dayjs.tz(r.nextRunAt, 'Asia/Jakarta');
  return now.isAfter(next) || now.isSame(next);
}

function computeNext(r: Reminder, base: dayjs.Dayjs): string | null {
  const kind = r.schedule.kind;
  const end = r.schedule.end ? dayjs.tz(r.schedule.end, 'Asia/Jakarta') : null;
  if (end && base.isAfter(end)) return null;
  if (kind === 'once') return null;
  if (kind === 'interval') {
    const ms = Math.max(60_000, Number(r.schedule.everyMs || 0));
    const last = r.lastRunAt ? dayjs.tz(r.lastRunAt, 'Asia/Jakarta') : base;
    const next = last.add(ms, 'millisecond');
    if (end && next.isAfter(end)) return null;
    return next.toISOString();
  }
  // Simple WEEKLY/DAILY RRULE support
  const { byDay, byHour, byMinute, freq } = parseRRule(String(r.schedule.rrule || ''));
  const start = r.schedule.start ? dayjs.tz(r.schedule.start, 'Asia/Jakarta') : null;
  let ref = base.add(1, 'minute');
  if (start && ref.isBefore(start)) ref = start;
  const targetHour = typeof byHour === 'number' ? byHour : 7;
  const targetMinute = typeof byMinute === 'number' ? byMinute : 0;
  if (freq === 'DAILY') {
    const next = ref.startOf('day').hour(targetHour).minute(targetMinute);
    if (next.isBefore(ref)) return next.add(1, 'day').toISOString();
    return next.toISOString();
  }
  if (freq === 'WEEKLY') {
    const map: any = { MO:1, TU:2, WE:3, TH:4, FR:5, SA:6, SU:0 };
    const days = (byDay && byDay.length ? byDay : ['MO','TU','WE','TH','FR','SA','SU']).map(d => map[d]);
    for (let i = 0; i < 14; i++) {
      const cand = ref.add(i, 'day');
      if (days.includes(cand.day())) {
        const next = cand.startOf('day').hour(targetHour).minute(targetMinute);
        if (next.isSame(ref) || next.isAfter(ref)) return next.toISOString();
      }
    }
    return null;
  }
  return null;
}

function renderText(r: Reminder): string {
  return r.text;
}

function updateAfterFire(r: Reminder, now: dayjs.Dayjs): void {
  r.lastRunAt = now.toISOString();
  r.countFired = (r.countFired || 0) + 1;
  const next = computeNext(r, now);
  r.nextRunAt = next;
  if (!next) r.status = 'done';
}

export function initURE(getSock: () => WASocket | null): void {
  if (timer) return;
  timer = setInterval(async () => {
    try {
      const list = await loadReminders();
      const now = dayjs();
      let dirty = false;
      for (const r of list) {
        if (r.status === 'active' && !r.nextRunAt) {
          // bootstrap nextRunAt
          const n = computeNext(r, now);
          r.nextRunAt = n;
          dirty = true;
        }
      }
      for (const r of list.filter(x => x.status === 'active')) {
        if (!isDue(r, now)) continue;
        const last = fireGuard.get(r.id) ?? 0;
        if (now.valueOf() - last < 20_000) continue;
        try {
          const s = getSock(); if (!s) continue;
          // Guard: chatJid must exist
          const jid = (r as any).chatJid as unknown as string | undefined;
          if (!jid || typeof jid !== 'string') {
            logger.warn({ id: r.id }, 'ure.fire.skip.missing_chatJid');
            r.status = 'paused';
            r.nextRunAt = null;
            dirty = true; // ensure we persist pause state
            continue;
          }
          const cfg = getData('config') || { tagAll: {} };
          const useTagAll = (typeof r.useTagAll === 'boolean') ? r.useTagAll : Boolean(cfg.tagAll?.universalRemindersDefault);
          const text = renderText(r);
          if (jid.endsWith('@g.us') && useTagAll) {
            await sendSystemTagAll(() => s, jid, text);
          } else {
            await s.sendMessage(jid, { text });
          }
          fireGuard.set(r.id, now.valueOf());
          updateAfterFire(r, now);
          dirty = true;
        } catch (e) {
          logger.error({ err: e as any, id: r.id }, 'ure.fire.error');
        }
      }
      // FIXED: Use updateReminders for atomic read-modify-write
      if (dirty) {
        await updateReminders(async (reminders) => ({
          reminders: list
        }));
      }
    } catch (e) {
      logger.error({ err: e as any }, 'ure.tick.error');
    }
  }, 30_000);
  logger.info('URE started');
}

export function stopURE(): void {
  if (timer) clearInterval(timer as unknown as number);
  timer = undefined;
}


