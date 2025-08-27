import { readWhitelist, type WhitelistEntry, type CoreRole } from '../storage/whitelist.js';

type RoleMap = Record<CoreRole, string[]>;

export async function getActiveCoreRoles(): Promise<RoleMap> {
  const wl = await readWhitelist();
  const map: RoleMap = { ketua_kelas: [], bendahara: [], sekretaris: [], developer: [] };
  for (const u of wl) {
    const roles = (u.roles || []) as CoreRole[];
    for (const r of roles) {
      if ((map as any)[r]) (map as any)[r].push(u.name);
    }
  }
  return map;
}


