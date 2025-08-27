import { readFile } from 'fs/promises';
import { getData, saveData } from './files.js';
import Fuse from 'fuse.js';

export type Lecturer = { code: number; name: string; wa: string; waJid: string };
export type EnrichedClass = { course: string; start: string; end: string; room: string | null; lecturer: Lecturer };
export type DayKey = 'senin' | 'selasa' | 'rabu' | 'kamis' | 'jumat' | 'sabtu' | 'minggu';
export type DayMap = Record<DayKey, EnrichedClass[]>;

// Base class shape used across schedule.days and overrides
export type BaseClass = { course: string; start: string; end: string; lecturerCode?: number; room?: string | null; reason?: string };

function toWaJid(wa: string): string { return `${wa}@s.whatsapp.net`; }

async function parseFirstJsonObject(path: string): Promise<any | null> {
  try {
    const txt = await readFile(path, 'utf8');
    let depth = 0;
    let start = -1;
    for (let i = 0; i < txt.length; i++) {
      const ch = txt[i];
      if (ch === '{') { if (start === -1) start = i; depth++; }
      else if (ch === '}') { depth--; if (depth === 0 && start !== -1) { const s = txt.slice(start, i + 1); return JSON.parse(s); } }
    }
    return null;
  } catch { return null; }
}

export async function buildEnrichedSchedule(): Promise<DayMap> {
  const rawLecturers: any = getData('lecturers') || {};
  const rawSchedule: any = getData('schedule') || {};
  let byCode: Record<string, any> = (rawLecturers?.byCode || {}) as any;
  // Support array-based lecturers (tests seed this shape)
  const arrayLects: any[] = Array.isArray(rawLecturers)
    ? rawLecturers
    : (Array.isArray(rawLecturers?.lecturers) ? rawLecturers.lecturers : []);
  const byId: Record<string, any> = Object.fromEntries(arrayLects.map((l: any, i: number) => [String(l.id ?? i), l]));

  if (!byCode || Object.keys(byCode).length === 0) {
    const first = await parseFirstJsonObject('data/lecturers.json');
    if (first?.byCode) byCode = first.byCode;
  }

  function normalizeDays(days: any): Record<string, any[]> | null {
    if (!days) return null;
    const out: Record<string, any[]> = { senin: [], selasa: [], rabu: [], kamis: [], jumat: [], sabtu: [], minggu: [] };
    const mapEngToId: Record<string, DayKey> = { Mon: 'senin', Tue: 'selasa', Wed: 'rabu', Thu: 'kamis', Fri: 'jumat', Sat: 'sabtu', Sun: 'minggu' } as any;
    for (const key of Object.keys(days)) {
      const val = Array.isArray(days[key]) ? days[key] : [];
      if ((out as any)[key]) (out as any)[key] = val;
      else {
        const mapped = mapEngToId[key as keyof typeof mapEngToId];
        if (mapped) out[mapped] = val;
      }
    }
    return out;
  }

  let idDays: Record<string, any[]> | null = normalizeDays(rawSchedule?.days);
  if (!idDays) {
    const first = await parseFirstJsonObject('data/schedule.json');
    if (first?.days) idDays = normalizeDays(first.days);
  }

  const days: DayMap = { senin: [], selasa: [], rabu: [], kamis: [], jumat: [], sabtu: [], minggu: [] } as DayMap;
  for (const day of Object.keys(days) as DayKey[]) {
    const entries = ((idDays && (idDays as any)[day]) || []) as any[];
    const seen = new Set<string>();
    for (const cls of entries) {
      const key = `${(cls.course || '').toLowerCase()}|${cls.start}|${cls.end}`;
      if (seen.has(key)) continue; seen.add(key);
      let lec: any = null;
      if (typeof cls.lecturerCode === 'number') lec = byCode[String(cls.lecturerCode)] || null;
      if (!lec && cls.lecturerId !== undefined) lec = byId[String(cls.lecturerId)] || null;
      if (lec) {
        const wa = String((lec.wa || lec.phone || '')).replace(/\D/g, '').replace(/^0/, '62');
        days[day].push({
          course: cls.course,
          start: cls.start,
          end: cls.end,
          room: cls.room ?? null,
          lecturer: { code: Number(cls.lecturerCode ?? 0), name: lec.name, wa, waJid: toWaJid(wa) }
        });
      } else {
        // allow missing lecturer; will be enriched later if possible
        days[day].push({
          course: cls.course,
          start: cls.start,
          end: cls.end,
          room: cls.room ?? null,
          lecturer: { code: -1, name: 'N/A', wa: '', waJid: '' }
        });
      }
    }
  }
  await saveData('enrichedSchedule', days);
  return days;
}

export function findLecturerByCourse(enriched: DayMap, course: string): Lecturer | null {
  const entries: { course: string; lecturer: Lecturer }[] = [];
  for (const day of Object.keys(enriched) as DayKey[]) {
    for (const cls of enriched[day]) {
      entries.push({ course: cls.course, lecturer: cls.lecturer });
    }
  }
  // Deduplicate by course name (case-insensitive)
  const seen = new Set<string>();
  const uniqueEntries = entries.filter((e) => {
    const k = e.course.toLowerCase();
    if (seen.has(k)) return false; seen.add(k); return true;
  });

  // Fuzzy search across course names to handle typos/abbrev (e.g., jarkom, traffi, antena)
  const fuse = new Fuse(uniqueEntries, {
    keys: ['course'],
    includeScore: true,
    threshold: 0.45,
    ignoreLocation: true,
    distance: 100
  });
  const q = String(course || '').trim();
  if (!q) return null;
  // Try direct contains first
  const direct = uniqueEntries.find(e => e.course.toLowerCase().includes(q.toLowerCase()));
  if (direct) return direct.lecturer;
  // Try common synonyms/expansions
  const altQueries = [
    q.replace(/jarkom/gi, 'jaringan komputer'),
    q.replace(/traff(i|ik)/gi, 'rekayasa trafik'),
    q.replace(/mcu/gi, 'mikrokontroler'),
    q.replace(/antena/gi, 'antena'),
    q
  ].filter((s, i, arr) => s && arr.indexOf(s) === i);
  for (const q2 of altQueries) {
    const hit = fuse.search(q2);
    if (hit && hit.length) {
      return hit[0]?.item.lecturer || null;
    }
  }
  // Fallback to fuzzy search on original query
  const fuzzy = fuse.search(q);
  return fuzzy && fuzzy.length ? fuzzy[0]?.item.lecturer || null : null;
}

// === Helpers for overrides + enrichment (on-the-fly) ===
export function getOverridesFor(dateISO: string): BaseClass[] {
  try {
    const schedule = getData('schedule') || { overrides: [] };
    return (schedule.overrides || []).filter((o: any) => o.date === dateISO);
  } catch {
    return [];
  }
}

export function mergeWithOverrides(dayClasses: BaseClass[], overrides: BaseClass[]): BaseClass[] {
  const result: BaseClass[] = [];
  const overrideCourses = new Set(overrides.map((o) => String(o.course || '').toLowerCase()));
  // keep only regular whose course not overridden
  for (const c of dayClasses) {
    const key = String(c.course || '').toLowerCase();
    if (!overrideCourses.has(key)) result.push(c);
  }
  // then append overrides (priority)
  for (const o of overrides) result.push(o);
  return result;
}

function buildLecturerIndex(): Record<string, { name: string; wa: string; waJid: string; code: number }> {
  const lecturers = getData('lecturers') || {};
  const byCode = (lecturers.byCode || {}) as Record<string, { name: string; wa: string; waJid?: string }>;
  const idx: Record<string, { name: string; wa: string; waJid: string; code: number }> = {};
  for (const key of Object.keys(byCode)) {
    const lc = byCode[key]!;
    const wa = String(lc.wa || '').replace(/\D/g, '').replace(/^0/, '62');
    const waJid = lc.waJid || `${wa}@s.whatsapp.net`;
    idx[key] = { name: lc.name, wa, waJid, code: Number(key) };
  }
  return idx;
}

export function enrich(classes: BaseClass[], fallbackEnriched?: DayMap): EnrichedClass[] {
  const byCode = buildLecturerIndex();
  const out: EnrichedClass[] = [];
  for (const cls of classes) {
    let lecturer: Lecturer | null = null;
    if (typeof cls.lecturerCode === 'number') {
      const key = String(cls.lecturerCode);
      const e = byCode[key];
      if (e) lecturer = { code: e.code, name: e.name, wa: e.wa, waJid: e.waJid };
    }
    if (!lecturer && fallbackEnriched) {
      const candidate = findLecturerByCourse(fallbackEnriched, cls.course);
      if (candidate) lecturer = candidate;
    }
    if (!lecturer) {
      // As last resort, try fuzzy over existing map using course only
      const candidate = fallbackEnriched ? findLecturerByCourse(fallbackEnriched, cls.course) : null;
      if (candidate) lecturer = candidate;
    }
    out.push({
      course: cls.course,
      start: cls.start,
      end: cls.end,
      room: (cls.room ?? null) as any,
      lecturer: lecturer || { code: -1, name: 'N/A', wa: '', waJid: '' }
    });
  }
  return out;
}
