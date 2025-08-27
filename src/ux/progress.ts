import type { WASocket, WAMessageKey } from '@whiskeysockets/baileys';
import { logger } from '../utils/logger.js';

export type Stage = 'queued'|'waiting'|'composing'|'tooling'|'sending'|'done'|'error';

const EMOJI: Record<Stage, string> = {
  queued: '🟦',
  waiting: '⌛',
  composing: '✍️',
  tooling: '🤖',
  sending: '📤',
  done: '✅',
  error: '🛑'
};

export const reactStage = async (sock: WASocket, jid: string, key: WAMessageKey, s: Stage): Promise<void> => {
  logger.info(`[UX] ATTEMPTING reaction: ${EMOJI[s]} (${s}) for ${jid}`);
  
  if (!sock || !sock.sendMessage) {
    logger.error(`[UX] Invalid sock object for reaction ${s}`);
    return;
  }
  
  if (!key || !key.remoteJid) {
    logger.error(`[UX] Invalid message key for reaction ${s}: ${JSON.stringify(key)}`);
    return;
  }
  
  try {
    const reactionPayload = { react: { text: EMOJI[s], key } };
    logger.info(`[UX] Sending reaction payload: ${JSON.stringify(reactionPayload)}`);
    
    await sock.sendMessage(jid, reactionPayload as any);
    logger.info(`[UX] ✅ Reaction sent successfully: ${EMOJI[s]} (${s}) for ${jid}`);
  } catch (error) {
    logger.error({ err: error, jid, stage: s, key }, '[UX] ❌ Failed to set reaction');
  }
};

export async function withPresence<T>(sock: WASocket, jid: string, run: () => Promise<T>): Promise<T> {
  let presenceInterval: NodeJS.Timeout | null = null;
  logger.info(`[UX] STARTING presence for ${jid}`);
  
  if (!sock || !sock.sendPresenceUpdate) {
    logger.error(`[UX] Invalid sock object for presence`);
    return await run();
  }
  
  try { 
    await sock.sendPresenceUpdate('composing', jid); 
    logger.info(`[UX] ✅ Started typing presence for ${jid}`);
    
    // Refresh presence every 8 seconds for long operations
    presenceInterval = setInterval(async () => {
      try {
        await sock.sendPresenceUpdate('composing', jid);
        logger.info(`[UX] 🔄 Refreshed typing presence for ${jid}`);
      } catch (error) {
        logger.error({ err: error, jid }, '[UX] ❌ Failed to refresh presence');
      }
    }, 8000);
    
  } catch (error) {
    logger.error({ err: error, jid }, '[UX] ❌ Failed to start typing presence');
  }
  
  try { 
    const result = await run(); 
    logger.info(`[UX] Operation completed for ${jid}`);
    return result;
  } finally { 
    if (presenceInterval) {
      clearInterval(presenceInterval);
      logger.info(`[UX] Cleared presence interval for ${jid}`);
    }
    
    try { 
      await sock.sendPresenceUpdate('paused', jid); 
      logger.info(`[UX] ✅ Stopped typing presence for ${jid}`);
    } catch (error) {
      logger.error({ err: error, jid }, '[UX] ❌ Failed to stop typing presence');
    }
  }
}
