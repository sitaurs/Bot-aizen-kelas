/**
 * Lock ringan in-process untuk mencegah race condition pada file I/O
 */
class FileLock {
  private locks = new Map<string, Promise<void>>();
  private queue = new Map<string, Array<() => void>>();

  /**
   * Eksekusi operasi dengan lock per path
   */
  async withLock<T>(filePath: string, operation: () => Promise<T>): Promise<T> {
    const currentLock = this.locks.get(filePath);
    
    if (currentLock) {
      // Ada lock aktif, tunggu dalam queue
      await currentLock;
    }

    // Buat promise baru untuk lock ini
    let releaseLock: () => void;
    const lockPromise = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });
    
    this.locks.set(filePath, lockPromise);

    try {
      const result = await operation();
      return result;
    } finally {
      // Release lock
      this.locks.delete(filePath);
      releaseLock!();
    }
  }
}

// Singleton instance untuk digunakan di seluruh aplikasi
export const fileLock = new FileLock();
