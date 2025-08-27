import { readFile, writeFile, mkdir, rename } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { logger } from '../utils/logger.js';
import { atomicWriteJSON } from '../utils/atomic.js';
import { fileLock } from '../utils/lock.js';

const DATA_DIR = 'data';
const STORAGE_DIR = 'storage';

// In-memory cache
let dataCache: { [key: string]: any } = {
  schedule: null,
  academicCalendar: null,
  lecturers: null,
  rooms: null,
  reminders: null,
  items: null,
  noteTakers: null,
  whitelist: null,
  materials: null,
  context: null,
  hydration: null,
  aiState: null,
  config: null
};

// Ensure directories exist
async function ensureDirectories() {
  const dirs = [DATA_DIR, STORAGE_DIR];
  for (const dir of dirs) {
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
  }
}

// Load JSON file with default fallback
async function loadJsonFile(filename: string, defaultValue: any = null) {
  const filepath = join(DATA_DIR, filename);
  
  try {
    if (existsSync(filepath)) {
      const content = await readFile(filepath, 'utf8');
      return JSON.parse(content);
    }
  } catch (error) {
    logger.error({ err: error as any, filename }, 'Error loading JSON file');
  }
  
  return defaultValue;
}

// Save JSON file with atomic write and file locking
async function saveJsonFile(filename: string, data: any) {
  const filepath = join(DATA_DIR, filename);
  
  return await fileLock.withLock(filepath, async () => {
    try {
      await atomicWriteJSON(filepath, data);
      logger.info(`Saved ${filename}`);
      return true;
    } catch (error) {
      logger.error({ err: error as any, filename }, 'Error saving JSON file');
      return false;
    }
  });
}

// Load all data
export async function loadAllData() {
  await ensureDirectories();
  
  dataCache.schedule = await loadJsonFile('schedule.json', {
    timezone: 'Asia/Jakarta',
    days: {
      Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: []
    },
    overrides: []
  });
  
  dataCache.academicCalendar = await loadJsonFile('academic_calendar.json', []);
  dataCache.lecturers = await loadJsonFile('lecturers.json', []);
  dataCache.rooms = await loadJsonFile('rooms.json', []);
  dataCache.reminders = await loadJsonFile('reminders.json', []);
  dataCache.items = await loadJsonFile('items.json', {});
  dataCache.noteTakers = await loadJsonFile('noteTakers.json', []);
  dataCache.whitelist = await loadJsonFile('whitelist.json', { people: [], dmAllowed: [], groupAllowed: [] });
  // Use camelCase file name to match saveData('funQuotes') behavior
  dataCache.funQuotes = await loadJsonFile('funQuotes.json', { quotes: [] });
  dataCache.exams = await loadJsonFile('exams.json', []);
  dataCache.cashReminders = await loadJsonFile('cashReminders.json', []);
  dataCache.materials = await loadJsonFile('materials/index.json', { byDate: {} });
  dataCache.context = await loadJsonFile('context.json', {});
  dataCache.hydration = await loadJsonFile('hydration.json', { dailyGoalMl: 2000, glassSizeMl: 250 });
  dataCache.aiState = await loadJsonFile('aiState.json', { keyIndex: 0 });
  dataCache.config = await loadJsonFile('config.json', { tagAll: { intro: true, dailySchedule06: true, tMinus15: true, carryItemsNight: true, carryItemsMorning: true, hydration: true, universalRemindersDefault: true, chunkSize: 80, cooldownSeconds: 120 } });
  
  logger.info('All data loaded successfully');
}

// Get data from cache
export function getData(type: string) {
  return dataCache[type];
}

// Save data to file and update cache
export async function saveData(type: string, data: any) {
  dataCache[type] = data;
  
  const filename = type === 'materials' ? 'materials/index.json' : `${type}.json`;
  return await saveJsonFile(filename, data);
}

// Update specific data
export async function updateData(type: string, updater: (data: any) => any) {
  const currentData = dataCache[type];
  const newData = updater(currentData);
  return await saveData(type, newData);
}

// Get storage path
export function getStoragePath(course: string, date: string) {
  return join(STORAGE_DIR, course, date);
}

// Ensure course directory exists
export async function ensureCourseDir(course: string, date: string) {
  const coursePath = join(STORAGE_DIR, course);
  const datePath = join(coursePath, date);
  
  if (!existsSync(coursePath)) {
    await mkdir(coursePath, { recursive: true });
  }
  
  if (!existsSync(datePath)) {
    await mkdir(datePath, { recursive: true });
  }
  
  return datePath;
}

export default {
  loadAllData,
  getData,
  saveData,
  updateData,
  getStoragePath,
  ensureCourseDir
};
