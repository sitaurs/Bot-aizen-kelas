import { z } from 'zod';
import { loadReminders, updateReminders } from '../scheduler/ure.store.js';
import { Reminder } from '../scheduler/ure.types.js';
import dayjs from 'dayjs';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

function toWeeklyRRule(byDay: string[], hour: number, minute: number): string {
  return `FREQ=WEEKLY;BYDAY=${byDay.join(',')};BYHOUR=${hour};BYMINUTE=${minute}`;
}

function toDailyRRule(hour: number, minute: number): string {
  return `FREQ=DAILY;BYHOUR=${hour};BYMINUTE=${minute}`;
}

export const reminderToolDecls = [
  {
    name: 'createUniversalReminder',
    description: 'Buat reminder fleksibel (once/rrule/interval/windowed_rrule)',
    parameters: {
      type: 'object',
      properties: {
        text: { type: 'string' },
        audience: { type: 'string', enum: ['group','dm'] },
        useTagAll: { type: 'boolean' },
        atISO: { type: 'string' },
        rrule: { type: 'string' },
        startISO: { type: 'string' },
        endISO: { type: 'string' },
        count: { type: 'number' },
        every: { type: 'object', properties: { unit: { type: 'string', enum: ['minute','hour','day'] }, value: { type: 'number' } } },
        weekdays: { type: 'array', items: { type: 'string' } },
        time: { type: 'object', properties: { hour: { type: 'number' }, minute: { type: 'number' } } },
        onlyNextWeekSameDay: { type: 'boolean' },
        dueAtISO: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } }
      },
      required: ['text']
    }
  },
  { 
    name: 'updateUniversalReminder', 
    description: 'Update reminder yang sudah ada dengan patch data baru',
    parameters: { 
      type: 'object', 
      properties: { 
        id: { type: 'string' }, 
        patch: { type: 'object' } 
      }, 
      required: ['id','patch'] 
    } 
  },
  { 
    name: 'pauseReminder', 
    description: 'Pause/suspend reminder sementara tanpa menghapus',
    parameters: { 
      type: 'object', 
      properties: { 
        id: { type: 'string' } 
      }, 
      required: ['id'] 
    } 
  },
  { 
    name: 'resumeReminder', 
    description: 'Resume reminder yang sudah di-pause sebelumnya',
    parameters: { 
      type: 'object', 
      properties: { 
        id: { type: 'string' } 
      }, 
      required: ['id'] 
    } 
  },
  { 
    name: 'deleteReminder', 
    description: 'Hapus reminder secara permanen dari sistem',
    parameters: { 
      type: 'object', 
      properties: { 
        id: { type: 'string' } 
      }, 
      required: ['id'] 
    } 
  },
  { 
    name: 'listReminders', 
    description: 'Tampilkan daftar reminder berdasarkan scope',
    parameters: { 
      type: 'object', 
      properties: { 
        scope: { type: 'string', enum: ['chat','mine','all'] } 
      } 
    } 
  },
  { 
    name: 'snoozeReminder', 
    description: 'Tunda reminder untuk beberapa menit ke depan',
    parameters: { 
      type: 'object', 
      properties: { 
        id: { type: 'string' }, 
        minutes: { type: 'number' } 
      }, 
      required: ['id','minutes'] 
    } 
  }
];

export async function reminderToolHandler(name: string, args: any & { _requesterJid?: string; _chatJid?: string }) {
  try {
    switch (name) {
      case 'createUniversalReminder':
        return await createReminder(args);
      case 'updateUniversalReminder':
        return await updateReminder(args.id, args.patch);
      case 'pauseReminder':
        return await patchReminder(args.id, { status: 'paused' });
      case 'resumeReminder':
        return await patchReminder(args.id, { status: 'active' });
      case 'deleteReminder':
        return await deleteReminder(args.id);
      case 'listReminders':
        return await listReminders(args.scope, args._requesterJid, args._chatJid);
      case 'snoozeReminder':
        return await snoozeReminder(args.id, args.minutes);
      default:
        return { ok: false, error: 'unknown_tool' };
    }
  } catch (e: any) {
    logger.error({ err: e as any, tool: name }, 'reminder.tool.error');
    return { ok: false, error: e?.message || 'error' };
  }
}

async function createReminder(payload: any & { _requesterJid?: string; _chatJid?: string }) {
  const list = await loadReminders();
  const id = uuidv4();
  const now = dayjs();
  const chatJid = payload._chatJid || payload.chatJid;
  const createdBy = payload._requesterJid || payload.createdBy;
  const text = String(payload.text || '').trim();
  if (!text) return { ok: false, error: 'text_required' };

  const r: Reminder = {
    id,
    chatJid,
    createdBy,
    createdAt: now.toISOString(),
    text,
    tz: 'Asia/Jakarta',
    schedule: { kind: 'once' },
    status: 'active',
    countFired: 0,
    meta: {}
  };

  if (payload.atISO) {
    r.schedule = { kind: 'once', at: payload.atISO };
    r.nextRunAt = payload.atISO;
  } else if (payload.every && payload.every.value && payload.every.unit) {
    const mult: any = { minute: 60_000, hour: 3_600_000, day: 86_400_000 };
    const ms = Math.max(60_000, Number(payload.every.value) * mult[payload.every.unit]);
    r.schedule = { kind: 'interval', everyMs: ms, start: payload.startISO, end: payload.endISO };
    r.nextRunAt = (payload.startISO || now.toISOString());
  } else if (payload.rrule || payload.weekdays || payload.time) {
    let rrule = String(payload.rrule || '');
    if (!rrule) {
      const hour = payload.time?.hour ?? 7; const minute = payload.time?.minute ?? 0;
      if (Array.isArray(payload.weekdays) && payload.weekdays.length) rrule = toWeeklyRRule(payload.weekdays, hour, minute);
      else rrule = toDailyRRule(hour, minute);
    }
    r.schedule = { kind: payload.onlyNextWeekSameDay ? 'windowed_rrule' : 'rrule', rrule, start: payload.startISO, end: payload.endISO, count: payload.count };
    r.nextRunAt = payload.startISO || now.toISOString();
  } else {
    // default once today + 5 minutes
    const at = now.add(5, 'minute').toISOString();
    r.schedule = { kind: 'once', at };
    r.nextRunAt = at;
  }

  if (payload.dueAtISO) r.meta = { ...(r.meta || {}), dueAtISO: payload.dueAtISO };
  if (Array.isArray(payload.tags)) r.meta = { ...(r.meta || {}), tags: payload.tags };
  if (typeof payload.useTagAll === 'boolean') (r as any).useTagAll = payload.useTagAll;

  list.push(r);
  await updateReminders(async () => ({ reminders: list }));
  return { ok: true, id: r.id, preview: { nextRunAt: r.nextRunAt, kind: r.schedule.kind } };
}

async function patchReminder(id: string, patch: Partial<Reminder>) {
  return await updateReminders(async (list) => {
    const idx = list.findIndex(r => r.id === id);
    if (idx < 0) return { reminders: list, result: { ok: false, error: 'not_found' } };
    const now = dayjs().toISOString();
    list[idx] = { ...list[idx], ...patch, updatedAt: now } as Reminder;
    return { reminders: list, result: { ok: true } };
  });
}

async function updateReminder(id: string, patch: Partial<Reminder>) {
  return patchReminder(id, patch);
}

async function deleteReminder(id: string) {
  return await updateReminders(async (list) => {
    const next = list.filter(r => r.id !== id);
    return { reminders: next, result: { ok: true } };
  });
}

async function listReminders(scope: 'chat'|'mine'|'all' = 'mine', requester?: string, chat?: string) {
  const list = await loadReminders();
  let rows = list;
  if (scope === 'chat' && chat) rows = rows.filter(r => r.chatJid === chat);
  if (scope === 'mine' && requester) rows = rows.filter(r => r.createdBy === requester);
  return { ok: true, reminders: rows.slice(0, 50) };
}

async function snoozeReminder(id: string, minutes: number) {
  return await updateReminders(async (list) => {
    const idx = list.findIndex(r => r.id === id);
    if (idx < 0) return { reminders: list, result: { ok: false, error: 'not_found' } };
    const addMs = Math.max(60_000, Math.floor(minutes * 60_000));
    const item = list[idx]!;
    const base = item.nextRunAt ? dayjs(item.nextRunAt) : dayjs();
    item.nextRunAt = base.add(addMs, 'millisecond').toISOString();
    return { reminders: list, result: { ok: true, nextRunAt: item.nextRunAt } };
  });
}


