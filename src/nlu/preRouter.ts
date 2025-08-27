import { handleToolCall } from '../ai/tools.js';
import { searchMaterials } from '../features/materials.js';
import { resolveCourseAlias } from '../features/courses.js';

function norm(s: string): string {
  return String(s || '').toLowerCase().trim();
}

export async function preRoute(text: string): Promise<{ handled: boolean; reply: string } | null> {
  const t = norm(text);
  if (!t) return null;

  // Random groups: bentuk/buat/bikin grup|group|grum|kelompok ... acak <N> (anak|orang|kelompok)
  const grpRe = /(bentuk|buat|bikin)\s+(grup|group|grum|kelompok|kelompak|klmpk)\s+(acak)\s+(\d+)\s+(anak|orang|kelompok)/i;
  const gm = t.match(grpRe);
  if (gm) {
    const n = Math.max(2, Math.min(20, parseInt(gm[4]!, 10) || 2));
    const res = await handleToolCall({ name: 'makeRandomGroups', args: { groupCount: n } });
    const groups = Array.isArray(res?.groups) ? res.groups : [];
    if (!groups.length) return { handled: true, reply: 'Gagal membuat kelompok.' };
    const lines: string[] = [];
    for (const g of groups) {
      lines.push(`👥 Kelompok ${g.index}`);
      for (const m of g.members || []) {
        lines.push(`- #${m.abs} ${m.name} — ${m.wa}`);
      }
    }
    return { handled: true, reply: lines.join('\n') };
  }

  // Materials quick search
  if (/\b(cari|ada)\s+materi\b/i.test(t) || /(ppt|pdf|foto papan|rumus)/i.test(t) || /\bmateri\b/i.test(t)) {
    // Extract simple keyword after 'materi'
    let q = '';
    const m1 = t.match(/materi\s+(.+)/i);
    if (m1) q = (m1[1] || '').trim();
    if (!q) {
      const m2 = t.match(/\b(cari|ada)\s+(.+)/i);
      if (m2) q = (m2[2] || '').trim();
    }
    if (!q) q = t.replace(/\bmateri\b/i, '').trim();
    q = q.split(/\s+/).slice(0, 5).join(' ');
    if (!q) return { handled: true, reply: 'Kata kunci materi apa?' };
    const found = await searchMaterials(q);
    if (!found.length) return { handled: true, reply: 'Tidak ketemu materi dengan kata kunci itu.' };
    const top = found.slice(0, 5);
    const lines = top.map((e: any) => `- ${e.course} (${e.date}) — ${e.captions?.[0] || e.files?.[0]?.filename || ''}`);
    return { handled: true, reply: `Dapat ${found.length} hasil. Teratas:\n${lines.join('\n')}` };
  }

  // Lecturer by course alias (allow bare alias like "seluler", "mikro")
  const canonical = await resolveCourseAlias(t);
  if (canonical) {
    const lr = await handleToolCall({ name: 'getLecturerByCourse', args: { courseQuery: canonical } });
    const list = Array.isArray(lr?.lecturers) ? lr.lecturers : [];
    if (!list.length) return { handled: true, reply: `Tidak ketemu dosen untuk ${canonical}.` };
    const lines = list.slice(0, 3).map((l: any) => `- *${l.name}* — wa.me/${l.wa}`);
    return { handled: true, reply: `Dosen ${canonical}:\n${lines.join('\n')}` };
  }

  return null;
}


