import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

let aliasMap: Record<string, string[]> | null = null;

async function loadAliases(): Promise<Record<string, string[]>> {
  if (aliasMap) return aliasMap;
  const path = 'data/course_aliases.json';
  if (existsSync(path)) {
    try {
      const txt = await readFile(path, 'utf8');
      aliasMap = JSON.parse(txt);
      return aliasMap!;
    } catch {
      aliasMap = {};
      return aliasMap!;
    }
  }
  aliasMap = {};
  return aliasMap!;
}

function normalize(s: string): string {
  return String(s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function resolveCourseAlias(qRaw: string): Promise<string | null> {
  const q = normalize(qRaw);
  if (!q) return null;
  const map = await loadAliases();
  // 1) exact contains alias
  for (const canonical of Object.keys(map)) {
    const aliases = map[canonical] || [];
    if (normalize(canonical) === q) return canonical;
    for (const a of aliases) {
      if (q.includes(normalize(a))) return canonical;
    }
  }
  // 2) token includes (fuzzy ringan)
  const qTokens = new Set(q.split(' '));
  for (const canonical of Object.keys(map)) {
    const aliases = [canonical, ...(map[canonical] || [])];
    for (const a of aliases) {
      const aTokens = new Set(normalize(a).split(' '));
      const inter = [...aTokens].filter(x => qTokens.has(x));
      if (inter.length >= Math.max(1, Math.ceil((aTokens.size) * 0.6))) return canonical;
    }
  }
  return null;
}


