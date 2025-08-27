import { writeFile, rename, unlink } from 'fs/promises';
import { randomBytes } from 'crypto';
import { dirname } from 'path';
import { existsSync } from 'fs';
import { mkdir } from 'fs/promises';

/**
 * Atomic JSON write dengan temp file → fsync → rename
 * Mencegah race condition dan korupsi data
 */
export async function atomicWriteJSON(filePath: string, data: any): Promise<void> {
  const tempSuffix = randomBytes(8).toString('hex');
  const tempPath = `${filePath}.tmp.${tempSuffix}`;
  
  try {
    // Pastikan direktori ada
    const dir = dirname(filePath);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
    
    // Tulis ke file temporary
    const content = JSON.stringify(data, null, 2);
    await writeFile(tempPath, content, 'utf8');
    
    // Rename atomic (OS-level atomic operation)
    await rename(tempPath, filePath);
  } catch (error) {
    // Cleanup temp file jika ada error
    try {
      await unlink(tempPath);
    } catch {
      // Ignore cleanup errors
    }
    throw error;
  }
}
