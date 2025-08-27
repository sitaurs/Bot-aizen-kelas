import { WASocket } from '@whiskeysockets/baileys';
import { logger } from '../utils/logger.js';

interface MentionAllParams {
  sock: WASocket;
  jid: string;
  text: string;
}

export async function handleMentionAll({ sock, jid, text }: MentionAllParams): Promise<void> {
  try {
    // Check if it's a group chat
    if (!jid.endsWith('@g.us')) {
      await sock.sendMessage(jid, { text: '❌ @ll hanya bisa digunakan di grup!' });
      return;
    }

    // Get group metadata
    const metadata = await sock.groupMetadata(jid);
    const participants = metadata.participants || [];
    
    if (participants.length === 0) {
      await sock.sendMessage(jid, { text: '❌ Tidak bisa mendapatkan daftar peserta grup' });
      return;
    }

    // Create mentions array
    const mentions = participants.map(p => p.id);
    
    // Add emoji and format message
    const formattedText = `📢 ${text}\n\nMention semua: ${mentions.length} orang`;
    
    // Send message with mentions
    await sock.sendMessage(jid, { 
      text: formattedText,
      mentions: mentions
    });
    
    logger.info(`Mention all sent to ${jid} with ${mentions.length} participants`);
  } catch (error) {
    logger.error({ err: error as any }, 'Error in mention all');
    await sock.sendMessage(jid, { text: '❌ Terjadi kesalahan saat mention semua' });
  }
}
