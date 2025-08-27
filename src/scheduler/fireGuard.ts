/**
 * Fire Guard untuk mencegah duplikasi notifikasi (idempotency)
 * State harian yang auto-reset untuk T-15 dan cron jobs lainnya
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { logger } from '../utils/logger.js';
import { fileLock } from '../utils/lock.js';

const STATE_DIR = 'data';
const STATE_FILE = 'cron.state.json';
const STATE_PATH = path.join(STATE_DIR, STATE_FILE);

interface FireGuardState {
  date: string; // Format YYYY-MM-DD untuk auto-reset harian
  fired: Set<string>; // Set signatures yang sudah fired hari ini
}

interface SerializedFireGuardState {
  date: string;
  fired: string[];
}

class FireGuard {
  private state: FireGuardState | null = null;

  /**
   * Load state harian dari file
   */
  private async loadState(): Promise<FireGuardState> {
    if (this.state) return this.state;

    return await fileLock.withLock(STATE_PATH, async () => {
      try {
        if (!existsSync(STATE_DIR)) {
          await mkdir(STATE_DIR, { recursive: true });
        }

        const today = new Date().toISOString().split('T')[0]!;

        if (!existsSync(STATE_PATH)) {
          const newState: FireGuardState = { 
            date: today, 
            fired: new Set<string>()
          };
          await this.saveState(newState);
          this.state = newState;
          return newState;
        }

        const raw = await readFile(STATE_PATH, 'utf8');
        const data: SerializedFireGuardState = JSON.parse(raw);
        
        // Reset jika tanggal berbeda (auto-reset harian)
        if (data.date !== today) {
          logger.info({ oldDate: data.date, newDate: today }, 'FireGuard daily reset');
          const newState: FireGuardState = { 
            date: today, 
            fired: new Set<string>()
          };
          await this.saveState(newState);
          this.state = newState;
          return newState;
        }

        // Convert array back to Set
        const state: FireGuardState = {
          date: data.date,
          fired: new Set(data.fired || [])
        };
        
        this.state = state;
        return state;
      } catch (error) {
        logger.error({ err: error as any }, 'Error loading cron state');
        const today = new Date().toISOString().split('T')[0]!;
        const fallback: FireGuardState = { 
          date: today, 
          fired: new Set<string>()
        };
        this.state = fallback;
        return fallback;
      }
    });
  }

  /**
   * Save state ke file (convert Set ke Array untuk JSON)
   */
  private async saveState(state: FireGuardState): Promise<void> {
    const serialized: SerializedFireGuardState = {
      date: state.date,
      fired: Array.from(state.fired)
    };
    
    await writeFile(STATE_PATH, JSON.stringify(serialized, null, 2), 'utf8');
  }

  /**
   * Update internal state dengan atomic operation
   */
  async updateState(signature: string, shouldFire: boolean): Promise<void> {
    return await fileLock.withLock(STATE_PATH, async () => {
      const currentState = await this.loadState();
      const today = new Date().toISOString().split('T')[0]!; // YYYY-MM-DD
      
      // Reset jika hari sudah berganti
      if (currentState.date !== today) {
        const newState: FireGuardState = {
          date: today,
          fired: new Set<string>()
        };
        
        if (shouldFire) {
          newState.fired.add(signature);
        }
        
        await this.saveState(newState);
        this.state = newState;
        return;
      }
      
      // Sama hari, update fired set
      if (shouldFire && !currentState.fired.has(signature)) {
        const newState: FireGuardState = {
          date: today,
          fired: new Set([...currentState.fired, signature])
        };
        
        await this.saveState(newState);
        this.state = newState;
      }
    });
  }

  /**
   * Cek apakah signature sudah pernah fired hari ini
   */
  async hasFired(signature: string): Promise<boolean> {
    const state = await this.loadState();
    return state.fired.has(signature);
  }

  /**
   * Mark signature sebagai fired (untuk testing atau manual trigger)
   */
  async markFired(signature: string): Promise<void> {
    await this.updateState(signature, true);
  }

  /**
   * Reset semua fired state (untuk testing)
   */
  async reset(): Promise<void> {
    return await fileLock.withLock(STATE_PATH, async () => {
      const today = new Date().toISOString().split('T')[0]!;
      const newState: FireGuardState = { 
        date: today, 
        fired: new Set<string>()
      };
      await this.saveState(newState);
      this.state = newState;
    });
  }

  /**
   * Manual set tanggal untuk testing
   */
  async setDate(dateStr: string): Promise<void> {
    return await fileLock.withLock(STATE_PATH, async () => {
      const currentState = await this.loadState();
      const newState: FireGuardState = { 
        date: dateStr, 
        fired: new Set(currentState.fired)
      };
      await this.saveState(newState);
      this.state = newState;
    });
  }

  /**
   * Generate T-15 signature untuk cron jobs
   */
  generateT15Signature(dateISO: string, groupJid: string, course: string, startHHMM: string): string {
    return `T15:${dateISO}:${groupJid}:${course}:${startHHMM}`;
  }

  /**
   * Alias untuk hasFired untuk backward compatibility
   */
  async alreadyFired(signature: string): Promise<boolean> {
    return await this.hasFired(signature);
  }
}

// Export instance singleton
export const cronFireGuard = new FireGuard();
