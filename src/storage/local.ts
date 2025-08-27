import { writeFile, readFile, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { StorageInterface } from '../types/index.js';
import { ensureCourseDir } from './files.js';
import { logger } from '../utils/logger.js';

export class LocalStorage implements StorageInterface {
  async saveFile(course: string, date: string, filename: string, buffer: Buffer, mime: string): Promise<string> {
    try {
      const datePath = await ensureCourseDir(course, date);
      const filePath = join(datePath, filename);
      
      await writeFile(filePath, buffer);
      
      logger.info(`File saved: ${filePath}`);
      return filePath;
    } catch (error) {
      logger.error({ err: error as any, filename }, 'Error saving file');
      throw new Error(`Failed to save file: ${error}`);
    }
  }

  async getFile(path: string): Promise<Buffer> {
    try {
      if (!existsSync(path)) {
        throw new Error(`File not found: ${path}`);
      }
      
      const buffer = await readFile(path);
      return buffer;
    } catch (error) {
      logger.error({ err: error as any, path }, 'Error reading file');
      throw new Error(`Failed to read file: ${error}`);
    }
  }

  async deleteFile(path: string): Promise<boolean> {
    try {
      if (!existsSync(path)) {
        return false;
      }
      
      await unlink(path);
      logger.info(`File deleted: ${path}`);
      return true;
    } catch (error) {
      logger.error({ err: error as any, path }, 'Error deleting file');
      return false;
    }
  }
}

export default LocalStorage;
