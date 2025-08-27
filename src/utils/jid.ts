import { jidNormalizedUser } from '@whiskeysockets/baileys';

/**
 * Normalisasi JID WhatsApp sederhana, return string
 */
export function normalizeJid(jid?: string | null): string {
  if (!jid || typeof jid !== 'string') {
    return '';
  }

  try {
    // Gunakan Baileys built-in normalization yang mendukung @lid
    return jidNormalizedUser(jid);
  } catch (error) {
    // Fallback untuk format yang tidak dapat dinormalisasi
    return jid;
  }
}

/**
 * Normalisasi JID WhatsApp dengan dukungan @lid dan validasi keamanan
 * Mencegah crash dari .endsWith() pada undefined/null
 */
export function normalizeJidSafe(jid?: string | null): { 
  jid?: string; 
  isGroup: boolean; 
  isValid: boolean;
} {
  if (!jid || typeof jid !== 'string') {
    return { isGroup: false, isValid: false };
  }

  try {
    // Gunakan Baileys built-in normalization yang mendukung @lid
    const normalized = jidNormalizedUser(jid);
    const isGroup = normalized.endsWith('@g.us');
    
    return {
      jid: normalized,
      isGroup,
      isValid: true
    };
  } catch (error) {
    // Fallback untuk format yang tidak dapat dinormalisasi
    return {
      jid: jid,
      isGroup: jid.endsWith('@g.us'),
      isValid: false
    };
  }
}

/**
 * Cek apakah JID adalah grup dengan aman
 */
export function isGroupJid(jid?: string | null): boolean {
  const normalized = normalizeJidSafe(jid);
  return normalized.isValid && normalized.isGroup;
}

/**
 * Ekstrak nomor WA dari JID dengan aman
 */
export function extractWaFromJid(jid?: string | null): string | null {
  const normalized = normalizeJidSafe(jid);
  if (!normalized.isValid || !normalized.jid) return null;
  
  if (normalized.isGroup) {
    return null; // Grup tidak memiliki nomor WA langsung
  }
  
  return normalized.jid.replace('@s.whatsapp.net', '');
}
