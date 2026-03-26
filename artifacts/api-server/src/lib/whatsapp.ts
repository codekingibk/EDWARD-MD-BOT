import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } from '@whiskeysockets/baileys';
import type { WASocket, ConnectionState, BaileysEventMap } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import type { Server as SocketIOServer } from 'socket.io';
import QRCode from 'qrcode';
import { logger } from './logger';
import path from 'path';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { handleMessage, handleCall, type HandlerConfig } from './messageHandler';
import { downloadAllPlugins, loadPlugins } from './plugins';

const log = logger.child({ module: 'WhatsApp' });

export class WhatsAppManager {
  private socket: WASocket | null = null;
  private io: SocketIOServer;
  private authDir: string;
  private reconnectAttempts = 0;
  private maxReconnects = 5;
  private reconnectDelay = 5000;
  private isShuttingDown = false;
  private pairingPhone: string | null = null;
  private config: HandlerConfig = {
    prefix: '.',
    botName: 'EDWARD MD',
    ownerNumber: '',
    publicMode: true,
    selfMode: false,
    autoRead: true,
    autoTyping: true,
    antiCall: true,
    antiLink: false,
    antiSpam: true,
    autoReact: false,
    statusSeen: true,
    statusReply: false,
    alwaysOnline: true,
    antiDelete: true,
    antiViewOnce: true,
    welcomeMessage: true,
    goodbyeMessage: true,
    language: 'en',
    version: '2.0.0',
  };
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

  updateConfig(update: Partial<HandlerConfig>) {
    Object.assign(this.config, update);
  }

  async connect(pairingPhone?: string) {
    this.isShuttingDown = false;
    if (pairingPhone) this.pairingPhone = pairingPhone;

    this.emitLog('info', 'Initializing Baileys WhatsApp connection...', 'Baileys');

    try {
      await downloadAllPlugins((msg) => this.emitLog('info', msg, 'PluginLoader'));
      await loadPlugins();
      this.emitLog('success', 'Plugins loaded successfully', 'PluginLoader');
    } catch (err: any) {
      this.emitLog('warn', `Plugin load warning: ${err.message}`, 'PluginLoader');
    }

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
      syncFullHistory: false,
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
        } catch {
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
        if (this.config.alwaysOnline) {
          await sock.sendPresenceUpdate('available').catch(() => {});
        }
        this.emitStats();
      }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', (upsert: BaileysEventMap['messages.upsert']) => {
      handleMessage(
        sock,
        upsert,
        this.config,
        (inc) => {
          if (inc.messagesReceived) this.stats.messagesReceived += inc.messagesReceived;
          if (inc.commandsExecuted) this.stats.commandsExecuted += inc.commandsExecuted;
          if (inc.activeUsers) this.stats.activeUsers += inc.activeUsers;
          this.emitStats();
        },
        (level: string, msg: string, src?: string) => this.emitLog(level as any, msg, src),
      ).catch((err) => log.error({ err: err.message }, 'Message handler error'));
    });

    sock.ev.on('call', (calls: any[]) => {
      handleCall(
        sock,
        calls,
        this.config,
        (level: string, msg: string, src?: string) => this.emitLog(level as any, msg, src),
      ).catch(() => {});
    });

    sock.ev.on('groups.upsert', (groups: BaileysEventMap['groups.upsert']) => {
      this.stats.activeGroups = Math.max(this.stats.activeGroups, groups.length);
      this.emitStats();
    });

    sock.ev.on('group-participants.update', async (update: any) => {
      const { id, participants, action } = update;
      if (action === 'add' && this.config.welcomeMessage) {
        for (const jid of participants) {
          await sock.sendMessage(id, {
            text: `👋 *Welcome to the group!*\n\n@${jid.split('@')[0]} has joined. We're glad to have you here! 🎉`,
            mentions: [jid],
          }).catch(() => {});
        }
        this.emitLog('info', `Welcome message sent in ${id}`, 'Groups');
      }
      if (action === 'remove' && this.config.goodbyeMessage) {
        for (const jid of participants) {
          await sock.sendMessage(id, {
            text: `👋 *Goodbye!*\n\n@${jid.split('@')[0]} has left the group. We'll miss you!`,
            mentions: [jid],
          }).catch(() => {});
        }
        this.emitLog('info', `Goodbye message sent in ${id}`, 'Groups');
      }
    });

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

  async logout() {
    this.isShuttingDown = true;
    if (this.socket) {
      await this.socket.logout().catch(() => {});
      this.socket.end(undefined);
      this.socket = null;
    }
    try { rmSync(this.authDir, { recursive: true, force: true }); mkdirSync(this.authDir, { recursive: true }); } catch {}
    this.emit('disconnected', { reason: 'logout' });
    this.emitLog('info', 'Session cleared and logged out', 'Baileys');
  }

  async restart() {
    await this.disconnect();
    this.isShuttingDown = false;
    await this.connect(this.pairingPhone || undefined);
  }

  getStatus() {
    return {
      connected: this.socket?.user != null,
      user: this.socket?.user,
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  getSocket() { return this.socket; }
  getConfig() { return this.config; }
}

let instance: WhatsAppManager | null = null;

export function getWhatsAppManager(io?: SocketIOServer): WhatsAppManager {
  if (!instance && io) {
    instance = new WhatsAppManager(io);
  }
  if (!instance) throw new Error('WhatsAppManager not initialized');
  return instance;
}
