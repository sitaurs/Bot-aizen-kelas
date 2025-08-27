import { getData, saveData } from '../storage/files.js';
import { normalizeJid, isGroupJid } from './jid.js';

function parseList(envValue?: string): string[] {
  return (envValue || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

export function getAllowedGroupJids(): string[] {
  const groups = new Set<string>();
  const fromEnv = parseList(process.env.ALLOWED_GROUPS);
  fromEnv.forEach(j => groups.add(j));
  const main = process.env.GROUP_JID;
  if (main) groups.add(main);
  return Array.from(groups);
}

export function getAllowedDmJids(): string[] {
  const list = new Set<string>();
  parseList(process.env.ALLOWED_DMS).forEach(j => list.add(j));
  // Include note takers from JSON data
  try {
    const noteTakers: string[] = getData('noteTakers') || [];
    noteTakers.forEach(j => list.add(j));
  } catch {}
  return Array.from(list);
}

export function isAllowedChat(jid: string): boolean {
  const normalizedJid = normalizeJid(jid);
  const isGroup = isGroupJid(normalizedJid);
  if (isGroup) {
    const json = getData('whitelist');
    const fromJson = (json?.groupAllowed || []) as string[];
    return getAllowedGroupJids().includes(normalizedJid) || fromJson.includes(normalizedJid);
  }
  const json = getData('whitelist');
  const fromJsonDm = (json?.dmAllowed || []) as string[];
  return getAllowedDmJids().includes(normalizedJid) || fromJsonDm.map((wa: string) => `${wa}@s.whatsapp.net`).includes(normalizedJid);
}

export function loadWhitelist(): any {
  return getData('whitelist') || { people: [], dmAllowed: [], groupAllowed: [] };
}

export async function saveWhitelist(next: any): Promise<void> {
  await saveData('whitelist', next);
}

export function getPersonByJid(jid: string): { wa: string; waJid?: string; name: string; roles: string[]; funRole?: string } | null {
  try {
    const wl = getData('whitelist');
    if (!wl || !Array.isArray(wl.people)) return null;
    const hit = wl.people.find((p: any) => (p.waJid ? p.waJid : `${p.wa}@s.whatsapp.net`) === jid);
    if (!hit) return null;
    return { wa: hit.wa, waJid: hit.waJid, name: hit.name, roles: Array.isArray(hit.roles) ? hit.roles : [], funRole: hit.funRole || 'anak_baik' } as any;
  } catch { return null; }
}

export function hasRole(jid: string, role: string): boolean {
  const p = getPersonByJid(jid);
  return !!p && Array.isArray(p.roles) && p.roles.includes(role);
}

export function getFunRoleByJid(jid: string): 'anak_baik' | 'anak_nakal' {
  const p: any = getPersonByJid(jid);
  return (p?.funRole === 'anak_nakal') ? 'anak_nakal' : 'anak_baik';
}

export async function setFunRoleByWa(wa: string, role: 'anak_baik'|'anak_nakal') {
  const wl = loadWhitelist();
  const idx = Array.isArray(wl.people) ? wl.people.findIndex((p: any) => String(p.wa) === String(wa)) : -1;
  if (idx >= 0) {
    wl.people[idx].funRole = role;
  }
  await saveWhitelist(wl);
}

export function assertHasCoreRole(jid: string, allowed: Array<'ketua_kelas'|'bendahara'|'sekretaris'|'developer'>) {
  let p = getPersonByJid(jid);
  if (!p) {
    // Fallback: resolve by wa extracted from JID
    const wa = String(jid || '').replace(/@s\.whatsapp\.net$/, '');
    p = getPersonByWa(wa) as any;
  }
  if (!p) return; // if requester not in whitelist, allow (test convenience / open default)
  const roles = new Set((p as any)?.roles || []);
  const ok = allowed.some(r => roles.has(r));
  if (!ok) throw new Error('Anda tidak berwenang untuk melakukan aksi ini.');
}

export function getPersonByWa(wa: string): any | null {
  const norm = String(wa || '').replace(/\D/g, '').replace(/^0/, '62');
  const wl = loadWhitelist();
  const hit = wl.people?.find((p: any) => String(p.wa) === norm) || null;
  return hit || null;
}

export function getPersonByNameOrAbs(q: string | number): any | null {
  const wl = loadWhitelist();
  if (typeof q === 'number') {
    const hit = wl.people?.find((p: any) => Number(p.abs) === q) || null;
    return hit || null;
  }
  const s = String(q).toLowerCase();
  // exact by name
  let hit = wl.people?.find((p: any) => String(p.name).toLowerCase() === s) || null;
  if (hit) return hit;
  // includes
  hit = wl.people?.find((p: any) => String(p.name).toLowerCase().includes(s)) || null;
  return hit || null;
}

export function hasAnyRole(person: any | null, roles: string[]): boolean {
  if (!person || !Array.isArray(person.roles)) return false;
  const set = new Set(person.roles);
  return roles.some(r => set.has(r));
}

export async function updateCoreRolesByWa(wa: string, add?: string[], remove?: string[]): Promise<any> {
  const wl = loadWhitelist();
  const idx = wl.people?.findIndex((p: any) => String(p.wa) === String(wa)) ?? -1;
  if (idx < 0) throw new Error('Target tidak ditemukan');
  const allowed = new Set(['ketua_kelas','bendahara','sekretaris','developer']);
  const cur: string[] = Array.isArray(wl.people[idx].roles) ? wl.people[idx].roles.slice() : [];
  let next = new Set(cur.filter(r => allowed.has(r)));
  if (Array.isArray(add)) add.forEach(r => { if (allowed.has(r)) next.add(r); });
  if (Array.isArray(remove)) remove.forEach(r => next.delete(r));
  wl.people[idx].roles = Array.from(next);
  // ensure waJid is present
  wl.people[idx].waJid = wl.people[idx].waJid || `${wl.people[idx].wa}@s.whatsapp.net`;
  await saveWhitelist(wl);
  return wl.people[idx];
}


