import { makeWASocket, useMultiFileAuthState, DisconnectReason, WASocket, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import P from 'pino';
import QRCode from 'qrcode-terminal';
import { logger } from '../utils/logger.js';
import { onMessageUpsert } from './handlers.js';
import { WhatsAppConnection as WhatsAppConnectionType } from '../types/index.js';

export class WhatsAppConnection {
  private sock: WASocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private pairingRequested = false;

  async connect(): Promise<WASocket> {
    try {
      const { state, saveCreds } = await useMultiFileAuthState('auth');
      const { version } = await fetchLatestBaileysVersion();
      
      this.sock = makeWASocket({
        auth: state,
        logger: P({ level: 'info' }),
        printQRInTerminal: false,
        browser: ['WhatsApp Class Manager Bot', 'Chrome', '1.0.0'],
        version
      });

      // Handle connection updates
      this.sock.ev.on('connection.update', async (update: any) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          try {
            QRCode.generate(qr, { small: true });
            logger.info('Scan QR code di atas untuk login');
          } catch {}
        } else if (!this.pairingRequested) {
          const msisdn = (process.env.WA_PAIRING_MSISDN || process.env.WA_PAIRING_CODE_MSISDN || '').replace(/\+/g, '').trim();
          if (msisdn && /^[0-9]{6,15}$/.test(msisdn)) {
            try {
              this.pairingRequested = true;
              const code = await this.sock!.requestPairingCode(msisdn);
              logger.info(`Pairing code untuk ${msisdn}: ${code}`);
            } catch (e) {
              logger.error({ err: e as any }, 'Gagal meminta pairing code');
            }
          }
        }

        if (connection === 'open') {
          logger.info('WhatsApp connected successfully!');
          this.reconnectAttempts = 0;
          
          // Get user info
          const user = this.sock!.user;
          logger.info(`Logged in as: ${user?.name} (${user?.id})`);
        }

        if (connection === 'close') {
          const shouldReconnect = (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
          
          if (shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.min(30000, 5000 * this.reconnectAttempts);
            logger.info(`Connection closed, attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${Math.round(delay/1000)}s`);
            setTimeout(() => { this.connect(); }, delay);
          } else {
            logger.error('Connection closed permanently');
          }
        }
      });

      // Handle credentials update
      this.sock.ev.on('creds.update', saveCreds);

      // Handle messages
      this.sock.ev.on('messages.upsert', (m: any) => {
        onMessageUpsert({ sock: this.sock!, upsert: m as any });
      });

      return this.sock;
    } catch (error) {
      logger.error({ err: error as any }, 'Error connecting to WhatsApp');
      throw error;
    }
  }

  async requestPairingCode(phoneNumber: string): Promise<string> {
    if (!this.sock) {
      throw new Error('Socket not connected');
    }

    try {
      // Remove + if present and ensure proper format
      const cleanPhone = phoneNumber.replace('+', '');
      const code = await this.sock.requestPairingCode(cleanPhone);
      
      logger.info(`Pairing code for ${phoneNumber}: ${code}`);
      return code;
    } catch (error) {
      logger.error({ err: error as any, phoneNumber }, 'Error requesting pairing code');
      throw error;
    }
  }

  async logout(): Promise<void> {
    if (this.sock) {
      await this.sock.logout();
      this.sock = null;
      logger.info('Logged out successfully');
    }
  }

  getSocket(): WASocket | null {
    return this.sock;
  }

  isConnected(): boolean {
    return this.sock?.user !== undefined;
  }
}

export default WhatsAppConnection;
