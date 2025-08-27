import { readFile } from 'fs/promises';
import path from 'path';

export type CoreRole = 'ketua_kelas'|'bendahara'|'sekretaris'|'developer';
export interface WhitelistEntry {
  name: string;
  phone: string;
  roles?: CoreRole[];
  funRole?: 'anak_baik'|'anak_nakal';
}

const WL_PATH = path.resolve('data/whitelist.json');

export async function readWhitelist(): Promise<WhitelistEntry[]> {
  try {
    const raw = await readFile(WL_PATH, 'utf8');
    const data = JSON.parse(raw);
    if (Array.isArray(data)) {
      // Already an array of entries
      return data as WhitelistEntry[];
    }
    // Compat with object shape { people: [], ... }
    if (data && Array.isArray(data.people)) {
      const people = data.people as any[];
      return people.map((p: any) => ({
        name: String(p.name || '').trim(),
        phone: String(p.wa || p.phone || '').trim(),
        roles: Array.isArray(p.roles) ? (p.roles as CoreRole[]) : [],
        funRole: p.funRole === 'anak_nakal' ? 'anak_nakal' : 'anak_baik'
      }));
    }
    return [];
  } catch {
    return [];
  }
}


