import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } from '@whiskeysockets/baileys';
import type { WASocket, ConnectionState, BaileysEventMap } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import type { Server as SocketIOServer } from 'socket.io';
import QRCode from 'qrcode';
import { logger } from './logger';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';

const log = logger.child({ module: 'WhatsApp' });

export class WhatsAppManager {
  private socket: WASocket | null = null;
  private io: SocketIOServer;
  private authDir: string;
  private reconnectAttempts = 0;
  private maxReconnects = 5;
  private reconnectDelay = 5000;
  private isShuttingDown = false;
  private stats = {
    messagesReceived: 0,
    messagesSent: 0,
    commandsExecuted: 0,
    activeGroups: 0,
    activeUsers: 0,
    startTime: Date.now(),
  };

  constructor(io: SocketIOServer) {
    this.io = io;
    this.authDir = path.resolve(process.cwd(), 'wa-auth');
    if (!existsSync(this.authDir)) {
      mkdirSync(this.authDir, { recursive: true });
    }
  }

  private emit(event: string, ...args: any[]) {
    this.io.emit(event, ...args);
  }

  private emitLog(level: 'info' | 'success' | 'warn' | 'error', message: string, source = 'WhatsApp') {
    this.emit('log', { level, message, source });
    log[level === 'success' ? 'info' : level]({ source }, message);
  }

  async connect(pairingPhone?: string) {
    this.isShuttingDown = false;
    this.emitLog('info', 'Initializing Baileys WhatsApp connection...', 'Baileys');

    const { version, isLatest } = await fetchLatestBaileysVersion();
    this.emitLog('info', `Using WA v${version.join('.')} (latest: ${isLatest})`, 'Baileys');

    const { state, saveCreds } = await useMultiFileAuthState(this.authDir);

    const sock = makeWASocket({
      version,
      logger: logger.child({ module: 'Baileys' }) as any,
      printQRInTerminal: false,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger.child({ module: 'KeyStore' }) as any),
      },
      browser: ['EDWARD MD', 'Chrome', '3.0.0'],
      generateHighQualityLinkPreview: false,
      getMessage: async () => undefined,
    });

    this.socket = sock;

    sock.ev.on('connection.update', async (update: Partial<ConnectionState>) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          const qrDataUrl = await QRCode.toDataURL(qr, {
            width: 300,
            margin: 2,
            color: { dark: '#000000', light: '#ffffff' },
          });
          this.emit('qr', qrDataUrl);
          this.emitLog('info', 'QR code generated — scan with WhatsApp', 'Pairing');
        } catch (err) {
          this.emitLog('error', 'Failed to generate QR image', 'Pairing');
        }
      }

      if (connection === 'close') {
        const reason = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const shouldReconnect = reason !== DisconnectReason.loggedOut;

        this.emit('disconnected', { reason });
        this.emitLog('warn', `Connection closed (reason: ${reason ?? 'unknown'})`, 'Baileys');

        if (shouldReconnect && !this.isShuttingDown && this.reconnectAttempts < this.maxReconnects) {
          this.reconnectAttempts++;
          const delay = this.reconnectDelay * this.reconnectAttempts;
          this.emitLog('info', `Reconnecting in ${delay / 1000}s (attempt ${this.reconnectAttempts}/${this.maxReconnects})`, 'Baileys');
          setTimeout(() => this.connect(), delay);
        } else if (reason === DisconnectReason.loggedOut) {
          this.emitLog('warn', 'Session logged out — please reconnect', 'Baileys');
        }
      } else if (connection === 'connecting') {
        this.emitLog('info', 'Connecting to WhatsApp...', 'Baileys');
      } else if (connection === 'open') {
        this.reconnectAttempts = 0;
        this.emit('connected', { jid: sock.user?.id, name: sock.user?.name });
        this.emitLog('success', `Connected as ${sock.user?.name ?? sock.user?.id}`, 'Baileys');
        this.emitStats();
      }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', (upsert: BaileysEventMap['messages.upsert']) => {
      const { messages, type } = upsert;
      if (type === 'notify') {
        for (const msg of messages) {
          if (!msg.key.fromMe) {
            this.stats.messagesReceived++;
            const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
            if (text.startsWith('.') || text.startsWith('!') || text.startsWith('/')) {
              this.stats.commandsExecuted++;
              this.emitLog('info', `Command: ${text.slice(0, 60)}`, 'MessageHandler');
            }
            this.emitStats();
          }
        }
      }
    });

    sock.ev.on('groups.upsert', (groups: BaileysEventMap['groups.upsert']) => {
      this.stats.activeGroups = Math.max(this.stats.activeGroups, groups.length);
    });

    // Request pairing code if phone provided (instead of QR)
    if (pairingPhone && !sock.authState.creds.registered) {
      setTimeout(async () => {
        try {
          const code = await sock.requestPairingCode(pairingPhone.replace(/[^0-9]/g, ''));
          this.emit('pairingCode', code);
          this.emitLog('info', `Pairing code for ${pairingPhone}: ${code}`, 'Pairing');
        } catch (err: any) {
          this.emitLog('error', `Failed to get pairing code: ${err.message}`, 'Pairing');
        }
      }, 2000);
    }

    return sock;
  }

  private emitStats() {
    this.emit('stats', {
      messagesReceived: this.stats.messagesReceived,
      messagesSent: this.stats.messagesSent,
      commandsExecuted: this.stats.commandsExecuted,
      activeGroups: this.stats.activeGroups,
      activeUsers: this.stats.activeUsers,
    });
  }

  async disconnect() {
    this.isShuttingDown = true;
    if (this.socket) {
      await this.socket.logout().catch(() => {});
      this.socket.end(undefined);
      this.socket = null;
      this.emit('disconnected', { reason: 'manual' });
      this.emitLog('info', 'Bot disconnected by user', 'Baileys');
    }
  }

  async restart() {
    await this.disconnect();
    this.isShuttingDown = false;
    await this.connect();
  }

  getStatus() {
    return {
      connected: this.socket?.user != null,
      user: this.socket?.user,
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  getSocket() { return this.socket; }
}

let instance: WhatsAppManager | null = null;

export function getWhatsAppManager(io?: SocketIOServer): WhatsAppManager {
  if (!instance && io) {
    instance = new WhatsAppManager(io);
  }
  if (!instance) throw new Error('WhatsAppManager not initialized');
  return instance;
}
