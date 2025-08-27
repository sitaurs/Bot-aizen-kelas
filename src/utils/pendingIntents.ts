import { getData, saveData } from '../storage/files.js';
import { logger } from './logger.js';

const TTL_MINUTES = 30; // 30 menit TTL untuk pending intents

/**
 * In-memory cache untuk testing
 */
const memoryCache = new Map<string, any>();

/**
 * Helper object untuk testing
 */
export const pendingIntents = {
  set: (key: string, data: any) => {
    memoryCache.set(key, data);
  },
  get: (key: string) => {
    return memoryCache.get(key);
  },
  clear: () => {
    memoryCache.clear();
  },
  cleanupExpired: (ttlMs: number) => {
    const now = Date.now();
    for (const [key, data] of memoryCache.entries()) {
      if (data.timestamp && (now - data.timestamp) > ttlMs) {
        memoryCache.delete(key);
      }
    }
  }
};

/**
 * Membersihkan pending intents yang expired
 */
export function cleanExpiredPendingIntents(): void {
  try {
    const aiState = getData('aiState') || {};
    if (!Array.isArray(aiState.pendingIntents)) {
      return;
    }

    const now = new Date();
    const beforeCount = aiState.pendingIntents.length;
    
    // Filter yang belum expired
    aiState.pendingIntents = aiState.pendingIntents.filter((intent: any) => {
      if (!intent.expiresAt) return true; // Keep jika tidak ada expiry
      
      const expiryTime = new Date(intent.expiresAt);
      return expiryTime > now;
    });
    
    const afterCount = aiState.pendingIntents.length;
    const cleaned = beforeCount - afterCount;
    
    if (cleaned > 0) {
      saveData('aiState', aiState);
      logger.info({ cleaned, remaining: afterCount }, 'Cleaned expired pending intents');
    }
  } catch (error) {
    logger.error({ err: error as any }, 'Error cleaning pending intents');
  }
}

/**
 * Menambahkan pending intent dengan TTL
 */
export async function addPendingIntent(
  userId: string, 
  intent: string, 
  args: any, 
  expect?: string
): Promise<void> {
  const aiState = getData('aiState') || {};
  if (!Array.isArray(aiState.pendingIntents)) {
    aiState.pendingIntents = [];
  }

  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + TTL_MINUTES);

  const pendingIntent = {
    userId,
    intent,
    args,
    expect,
    expiresAt: expiresAt.toISOString(),
    createdAt: new Date().toISOString()
  };

  aiState.pendingIntents.push(pendingIntent);
  await saveData('aiState', aiState);
}

/**
 * Mendapatkan dan menghapus pending intent untuk user
 */
export async function clearPendingIntent(userId: string): Promise<any> {
  cleanExpiredPendingIntents(); // Cleanup dulu
  
  const aiState = getData('aiState') || {};
  if (!Array.isArray(aiState.pendingIntents)) {
    return null;
  }

  const index = aiState.pendingIntents.findIndex((intent: any) => intent.userId === userId);
  if (index === -1) {
    return null;
  }

  const pendingIntent = aiState.pendingIntents[index];
  aiState.pendingIntents.splice(index, 1);
  await saveData('aiState', aiState);
  
  return pendingIntent;
}

/**
 * Setup periodic cleanup - dipanggil dari main app
 */
export function setupPendingIntentCleanup(): void {
  // Cleanup setiap 10 menit
  setInterval(cleanExpiredPendingIntents, 10 * 60 * 1000);
  logger.info('Pending intent TTL cleanup scheduled');
}
