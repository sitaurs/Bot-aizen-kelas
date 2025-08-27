import { v4 as uuidv4 } from 'uuid';

export const generateId = (prefix = '') => {
  const id = uuidv4().replace(/-/g, '').substring(0, 8);
  return prefix ? `${prefix}_${id}` : id;
};

export const generateReminderId = () => generateId('rem');
export const generateExamId = () => generateId('exam');
export const generateMaterialId = () => generateId('mat');
export const generateCashId = () => generateId('cash');

export const isValidJid = (jid: string) => {
  return jid && (jid.endsWith('@s.whatsapp.net') || jid.endsWith('@g.us'));
};

export const extractPhoneFromJid = (jid: string) => {
  if (!jid) return null;
  return jid.split('@')[0];
};
