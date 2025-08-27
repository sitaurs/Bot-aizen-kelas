import { readFile, writeFile, rename, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { Reminder } from './ure.types.js';
import { fileLock } from '../utils/lock.js';

const DATA_PATH = path.resolve('data/reminders.json');

async function ensureDir(): Promise<void> {
  const dir = path.dirname(DATA_PATH);
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
}

export async function loadReminders(): Promise<Reminder[]> {
  try {
    if (!existsSync(DATA_PATH)) return [];
    const raw = await readFile(DATA_PATH, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? (data as Reminder[]) : [];
  } catch {
    return [];
  }
}

export async function saveReminders(list: Reminder[]): Promise<void> {
  await ensureDir();
  const tmp = DATA_PATH + '.tmp';
  await writeFile(tmp, JSON.stringify(list, null, 2), 'utf8');
  await rename(tmp, DATA_PATH);
}

/**
 * UNIFIED UPDATE METHOD - All reminder modifications must go through this
 * Provides full read-modify-write locking to prevent race conditions
 */
export async function updateReminders(
  updater: (reminders: Reminder[]) => Promise<{ reminders: Reminder[]; result?: any }> | { reminders: Reminder[]; result?: any }
): Promise<any> {
  return await fileLock.withLock(DATA_PATH, async () => {
    const currentReminders = await loadReminders();
    const updateResult = await updater(currentReminders);
    await saveReminders(updateResult.reminders);
    return updateResult.result;
  });
}


