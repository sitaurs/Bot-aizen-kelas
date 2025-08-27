import { getData } from '../storage/files.js';

const lastQuoteAtByJid = new Map<string, number>();
const COOLDOWN_MS = 60 * 60 * 1000; // 60 minutes

export function pickRandomQuote(): string {
  try {
    const data = getData('funQuotes');
    const arr: string[] = (data?.quotes || []) as string[];
    if (Array.isArray(arr) && arr.length > 0) {
      const idx = Math.floor(Math.random() * arr.length);
      return String(arr[idx] || '').trim();
    }
  } catch {}
  return '';
}

export function maybeAppendQuote(jid: string, baseText: string, enabled: boolean): string {
  if (!enabled) return baseText;
  const now = Date.now();
  const last = lastQuoteAtByJid.get(jid) || 0;
  if (now - last < COOLDOWN_MS) return baseText;
  const q = pickRandomQuote();
  if (!q) return baseText;
  lastQuoteAtByJid.set(jid, now);
  const suffix = `\n—\n🌱 Catatan Aizen:\n"${q}"`;
  return `${baseText}\n${suffix}`;
}


