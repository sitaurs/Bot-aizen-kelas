import { getPersonByJid } from './access.js';

/**
 * Validasi gating access unified untuk @ll dan mentionAll
 * Aturan: anak_nakal non-core ditolak, core roles memiliki akses
 */
export function validateMentionAllAccess(senderJid: string): {
  allowed: boolean;
  reason?: string;
} {
  const person = getPersonByJid(senderJid);
  
  if (!person) {
    // Jika tidak ada di whitelist, default allow (untuk development/testing)
    return { allowed: true };
  }
  
  const funRole = person.funRole || 'anak_baik';
  const coreRoles = ['ketua_kelas', 'bendahara', 'sekretaris', 'developer'];
  const hasCoreRole = Array.isArray(person.roles) && 
    person.roles.some(role => coreRoles.includes(role));
  
  // Anak nakal tanpa core role ditolak
  if (funRole === 'anak_nakal' && !hasCoreRole) {
    return { 
      allowed: false, 
      reason: '🙅‍♀️ Maaf, kamu tidak diizinkan menggunakan mention all.' 
    };
  }
  
  // Core roles selalu diizinkan, anak_baik juga diizinkan
  return { allowed: true };
}

/**
 * Validasi untuk tools yang memerlukan core role specific
 */
export function validateCoreRoleAccess(
  senderJid: string, 
  requiredRoles: string[]
): {
  allowed: boolean;
  reason?: string;
} {
  const person = getPersonByJid(senderJid);
  
  if (!person) {
    // Jika tidak ada di whitelist, default allow (untuk development/testing)
    return { allowed: true };
  }
  
  const hasRequiredRole = Array.isArray(person.roles) && 
    person.roles.some(role => requiredRoles.includes(role));
  
  if (!hasRequiredRole) {
    return {
      allowed: false,
      reason: 'Anda tidak berwenang untuk melakukan aksi ini.'
    };
  }
  
  return { allowed: true };
}
