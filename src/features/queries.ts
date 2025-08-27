import { DayMap, buildEnrichedSchedule, findLecturerByCourse } from '../storage/loaders.js';

export async function ruleLookupLecturer(text: string): Promise<{ name:string; wa:string; code:number } | null> {
  const t = text.toLowerCase();
  if (!/dosen/.test(t)) return null;
  // naive extraction after keyword 'dosen'
  const course = t.replace(/.*dosen/,'').trim();
  const enriched = (await buildEnrichedSchedule()) as DayMap;
  const lec = findLecturerByCourse(enriched, course);
  if (!lec) return null;
  return { name: lec.name, wa: lec.wa, code: lec.code };
}
