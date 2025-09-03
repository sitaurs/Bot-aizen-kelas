import { WASocket } from '@whiskeysockets/baileys';
import { sendTextMessage } from '../wa/handlers.js';
import { getData } from '../storage/files.js';
import { logger } from '../utils/logger.js';

/**
 * Get all group IDs for broadcasting - HANYA dari env GROUP_IDS
 */
export function getAllBroadcastGroups(): string[] {
  // HANYA dari env GROUP_IDS dan backward compatibility GROUP_JID
  const groupIds = (process.env.GROUP_IDS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  
  // Backward compatibility: old GROUP_JID
  const envG = process.env.GROUP_JID ? [process.env.GROUP_JID] : [];
    
  const src = [...groupIds, ...envG];
  return Array.from(new Set(src.filter((s: string) => typeof s === 'string' && s.endsWith('@g.us'))));
}

/**
 * Broadcast a text message to all configured groups
 */
export async function broadcastToAllGroups(sock: WASocket, message: string): Promise<void> {
  const groups = getAllBroadcastGroups();
  
  if (groups.length === 0) {
    logger.warn('[BROADCAST] No groups configured for broadcasting');
    return;
  }
  
  logger.info(`[BROADCAST] Sending message to ${groups.length} groups: ${message.slice(0, 50)}...`);
  
  const promises = groups.map(async (groupJid) => {
    try {
      await sendTextMessage(sock, groupJid, message);
      logger.info(`[BROADCAST] ✅ Sent to ${groupJid}`);
    } catch (error) {
      logger.error({ err: error, groupJid }, `[BROADCAST] ❌ Failed to send to ${groupJid}`);
    }
  });
  
  await Promise.allSettled(promises);
  logger.info(`[BROADCAST] Completed broadcasting to ${groups.length} groups`);
}

/**
 * Check if text is a broadcast command (starts with "cht ")
 */
export function isBroadcastCommand(text: string): boolean {
  return text.trim().toLowerCase().startsWith('cht ');
}

/**
 * Extract broadcast message from command text
 */
export function extractBroadcastMessage(text: string): string {
  return text.trim().slice(4); // Remove "cht " prefix
}
