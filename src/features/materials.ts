import { WASocket } from '@whiskeysockets/baileys';
import { WhatsAppMessage, MaterialEntry } from '../types/index.js';
import { LocalStorage } from '../storage/local.js';
import { getData, updateData } from '../storage/files.js';
import { generateMaterialId } from '../utils/id.js';
import { getToday } from '../utils/time.js';
import { logger } from '../utils/logger.js';

const storage = new LocalStorage();

interface SaveIncomingMediaParams {
  sock: WASocket;
  msg: WhatsAppMessage;
  buffer: Buffer;
  filename: string;
  caption: string | null;
  mediaType: string;
}

export async function saveIncomingMedia({
  sock,
  msg,
  buffer,
  filename,
  caption,
  mediaType
}: SaveIncomingMediaParams): Promise<void> {
  try {
    const jid = msg.key.remoteJid!;
    const today = getToday();
    
    // For now, we'll use a default course name
    // In a real implementation, you might want to ask the user for the course
    const course = 'Default Course'; // This should be configurable
    
    // Save file to storage
    const filePath = await storage.saveFile(course, today, filename, buffer, getMimeType(mediaType));
    
    // Update materials index
    await updateData('materials', (materials) => {
      if (!materials.byDate[today]) {
        materials.byDate[today] = [];
      }
      
      const materialEntry = {
        id: generateMaterialId(),
        course,
        dateISO: today,
        captions: caption ? [caption] : [],
        files: [{
          path: filePath,
          filename,
          mime: getMimeType(mediaType),
          size: buffer.length
        }],
        createdAt: new Date().toISOString()
      };
      
      materials.byDate[today].push(materialEntry);
      return materials;
    });
    
    logger.info(`Material saved: ${filePath}`);
  } catch (error) {
    logger.error({ err: error as any }, 'Error saving incoming media');
    throw error;
  }
}

function getMimeType(mediaType: string): string {
  switch (mediaType) {
    case 'image':
      return 'image/jpeg';
    case 'video':
      return 'video/mp4';
    case 'audio':
      return 'audio/ogg';
    case 'document':
      return 'application/pdf';
    default:
      return 'application/octet-stream';
  }
}

export async function searchMaterials(query: string, course?: string, dateFrom?: string, dateTo?: string): Promise<any[]> {
  try {
    const materials = getData('materials');
    const results: any[] = [];
    
    for (const [date, entries] of (Object.entries(materials.byDate) as [string, MaterialEntry[]][])) {
      // Check date range
      if (dateFrom && date < dateFrom) continue;
      if (dateTo && date > dateTo) continue;
      
      for (const entry of entries as MaterialEntry[]) {
        // Check course filter
        if (course && entry.course.toLowerCase() !== course.toLowerCase()) {
          continue;
        }
        
        // Check if query matches
        const searchText = `${entry.course} ${entry.captions.join(' ')}`.toLowerCase();
        if (searchText.includes(query.toLowerCase())) {
          results.push({
            id: entry.id,
            course: entry.course,
            date: entry.dateISO,
            captions: entry.captions,
            files: entry.files
          });
        }
      }
    }
    
    return results;
  } catch (error) {
    logger.error({ err: error as any }, 'Error searching materials');
    return [];
  }
}

export async function getMaterialFile(materialId: string): Promise<Buffer | null> {
  try {
    const materials = getData('materials');
    
    // Find the material entry
    for (const entries of Object.values(materials.byDate) as MaterialEntry[][]) {
      for (const entry of entries as MaterialEntry[]) {
        if (entry.id === materialId) {
          // Get the first file (you might want to handle multiple files)
          const file = entry.files[0];
          if (file) {
            return await storage.getFile(file.path);
          }
        }
      }
    }
    
    return null;
  } catch (error) {
    logger.error({ err: error as any }, 'Error getting material file');
    return null;
  }
}

export async function sendMaterialToChat(sock: WASocket, jid: string, materialId: string): Promise<boolean> {
  try {
    const materials = getData('materials');
    
    // Find the material entry
    for (const entries of Object.values(materials.byDate) as MaterialEntry[][]) {
      for (const entry of entries as MaterialEntry[]) {
        if (entry.id === materialId) {
          // Send each file
          for (const file of entry.files) {
            const buffer = await storage.getFile(file.path);
            
            let message: any = {};
            const caption = entry.captions.join('\n');
            
            if (file.mime.startsWith('image/')) {
              message = {
                image: buffer,
                caption: caption || `${entry.course} - ${entry.dateISO}`
              };
            } else if (file.mime.startsWith('video/')) {
              message = {
                video: buffer,
                caption: caption || `${entry.course} - ${entry.dateISO}`
              };
            } else {
              message = {
                document: buffer,
                fileName: file.filename,
                caption: caption || `${entry.course} - ${entry.dateISO}`
              };
            }
            
            await sock.sendMessage(jid, message);
          }
          
          return true;
        }
      }
    }
    
    return false;
  } catch (error) {
    logger.error({ err: error as any }, 'Error sending material to chat');
    return false;
  }
}
