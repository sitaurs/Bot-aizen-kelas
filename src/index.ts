import 'dotenv/config';
import { WhatsAppConnection } from './wa/connect.js';
import { GeminiAI } from './ai/gemini.js';
import { initCron } from './scheduler/cron.js';
import { initURE } from './scheduler/ure.js';
import { loadAllData } from './storage/files.js';
import { logger } from './utils/logger.js';

async function main(): Promise<void> {
  try {
    logger.info('Starting WhatsApp Class Manager Bot...');
    
    // Load all data
    await loadAllData();
    logger.info('Data loaded successfully');
    
    // Initialize AI
    const ai = new GeminiAI();
    logger.info('AI initialized');
    
    // Connect to WhatsApp
    const waConnection = new WhatsAppConnection();
    const sock = await waConnection.connect();
    logger.info('WhatsApp connection established');
    
    // Initialize cron jobs
    await initCron({ getSock: () => waConnection.getSocket(), ai });
    logger.info('Cron jobs initialized');
    // Start Universal Reminder Engine (URE)
    initURE(() => waConnection.getSocket());
    logger.info('Universal Reminder Engine started');
    
    // Keep the process running
    process.on('SIGINT', async () => {
      logger.info('Shutting down (no logout, session preserved)...');
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      logger.info('Shutting down (no logout, session preserved)...');
      process.exit(0);
    });
    
    logger.info('Bot is ready! 🚀');
    
  } catch (error) {
    logger.error({ err: error as any }, 'Error starting bot');
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error({ err: error as any }, 'Uncaught Exception');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error({ err: reason as any, promise }, 'Unhandled Rejection');
  process.exit(1);
});

main().catch((error) => {
  logger.error('Fatal error:', error);
  process.exit(1);
});
