import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import isBetween from 'dayjs/plugin/isBetween.js';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isBetween);
dayjs.tz.setDefault('Asia/Jakarta');

export const formatTime = (time: string, format = 'HH:mm') => {
  return dayjs.tz(time, 'Asia/Jakarta').format(format);
};

export const formatDate = (date: string, format = 'YYYY-MM-DD') => {
  return dayjs.tz(date, 'Asia/Jakarta').format(format);
};

export const getToday = (): string => {
  return dayjs().tz('Asia/Jakarta').format('YYYY-MM-DD');
};

export const getDayName = (date: string) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[dayjs.tz(date, 'Asia/Jakarta').day()];
};

export const addMinutes = (time: string, minutes: number) => {
  return dayjs.tz(time, 'Asia/Jakarta').add(minutes, 'minute');
};

export const isBefore = (time1: string, time2: string) => {
  return dayjs.tz(time1, 'Asia/Jakarta').isBefore(dayjs.tz(time2, 'Asia/Jakarta'));
};

export const now = () => {
  return dayjs().tz('Asia/Jakarta');
};

export type ScheduleQuery =
  | { kind: 'today' }
  | { kind: 'tomorrow' }
  | { kind: 'day'; dow: 'senin'|'selasa'|'rabu'|'kamis'|'jumat'|'sabtu'|'minggu' }
  | { kind: 'this_week' }
  | { kind: 'next_week' }
  | { kind: 'last_week' }
  | { kind: 'range_mf' };

export function parseScheduleQuery(text: string): ScheduleQuery | null {
  const t = String(text || '').toLowerCase().trim();
  if (!t) return null;
  // Relative
  if (/(\bhari ini\b)/i.test(t)) return { kind: 'today' };
  if (/(\bbesok\b)/i.test(t)) return { kind: 'tomorrow' };
  if (/(\blusa\b)/i.test(t)) {
    // treat lusa as tomorrow+1, but we still route via day if possible
    const iso = normalizeRelativeDate('lusa');
    if (iso) {
      const dn = String(getDayName(iso) || '').toLowerCase();
      const map: any = { sun: 'minggu', mon: 'senin', tue: 'selasa', wed: 'rabu', thu: 'kamis', fri: 'jumat', sat: 'sabtu' };
      return { kind: 'day', dow: map[dn] } as any;
    }
  }
  // Week phrases
  if (/(\bminggu ini\b|\bpekan ini\b)/i.test(t)) return { kind: 'this_week' };
  if (/(\bminggu depan\b|\bmingdep\b)/i.test(t)) return { kind: 'next_week' };
  if (/(\bminggu lalu\b)/i.test(t)) return { kind: 'last_week' };
  // Day of week (ID) including jum'at variant
  const m = t.match(/\b(senin|selasa|rabu|kamis|jum'?at|sabtu|minggu)\b/i);
  if (m) {
    const raw = m[1]!.toLowerCase();
    const dow = raw.replace(/jum'?at/, 'jumat') as any;
    return { kind: 'day', dow } as ScheduleQuery;
  }
  // Range Mon-Fri (various connectors)
  if (/senin\s*(?:-|–|—|s\.?d\.?|sd|sampai)\s*jum'?at/i.test(t)) return { kind: 'range_mf' };
  return null;
}

export function weekRange(kind: 'this_week'|'next_week'|'last_week'): { startISO: string; endISO: string } {
  const ref = dayjs().tz('Asia/Jakarta');
  const curDow = ref.day(); // 0=Sun..6=Sat
  // compute Monday of current week
  const deltaToMonday = (curDow + 6) % 7; // how many days to subtract
  let start = ref.subtract(deltaToMonday, 'day').startOf('day');
  if (kind === 'next_week') start = start.add(7, 'day');
  if (kind === 'last_week') start = start.subtract(7, 'day');
  const end = start.add(6, 'day').endOf('day'); // Monday..Sunday
  return { startISO: start.format('YYYY-MM-DD'), endISO: end.format('YYYY-MM-DD') };
}

export function normalizeRelativeDate(input: string, base?: string): string | null {
  const ref = base ? dayjs.tz(base, 'Asia/Jakarta') : dayjs().tz('Asia/Jakarta');
  const txt = input.toLowerCase();
  if (/(besok|besuk)/.test(txt)) return ref.add(1, 'day').format('YYYY-MM-DD');
  if (/(lusa)/.test(txt)) return ref.add(2, 'day').format('YYYY-MM-DD');
  if (/(hari ini|today)/.test(txt)) return ref.format('YYYY-MM-DD');
  // hari ke depan: senin, selasa, rabu...
  const dayMap: Record<string, number> = { minggu:0, ahad:0, senin:1, selasa:2, rabu:3, kamis:4, jumat:5, jumaat:5, sabtu:6 };
  const m = txt.match(/(minggu|ahad|senin|selasa|rabu|kamis|jum(?:a|aa)t|sabtu)(?:\s*(depan|ini))?/);
  if (m) {
    const key = m[1] as keyof typeof dayMap;
    const target = dayMap[key];
    if (typeof target !== 'number') return null;
    const cur = ref.day();
    let delta = (target - cur + 7) % 7;
    if (delta === 0 && m[2] === 'depan') delta = 7;
    if (delta === 0 && !m[2]) delta = 7; // default: next occurrence
    return ref.add(delta, 'day').format('YYYY-MM-DD');
  }
  // English day names/abbrevs: mon, tue, wed, thu, fri, sat, sun (+ long forms)
  const enMap: Record<string, number> = {
    sun: 0, sunday: 0,
    mon: 1, monday: 1,
    tue: 2, tues: 2, tuesday: 2,
    wed: 3, weds: 3, wednesday: 3,
    thu: 4, thur: 4, thurs: 4, thursday: 4,
    fri: 5, friday: 5,
    sat: 6, saturday: 6
  };
  const mEn = txt.match(/(sun|sunday|mon|monday|tue|tues|tuesday|wed|weds|wednesday|thu|thur|thurs|thursday|fri|friday|sat|saturday)(?:\s*(next|this))?/);
  if (mEn) {
    const key = mEn[1] as keyof typeof enMap;
    const target = enMap[key];
    if (typeof target !== 'number') return null;
    const cur = ref.day();
    let delta = (target - cur + 7) % 7;
    if (delta === 0 && mEn[2] === 'next') delta = 7;
    if (delta === 0 && !mEn[2]) delta = 7;
    return ref.add(delta, 'day').format('YYYY-MM-DD');
  }
  return null;
}

export default dayjs;
