import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, Browsers } from '@whiskeysockets/baileys';
import type { WASocket, ConnectionState, BaileysEventMap } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import type { Server as SocketIOServer } from 'socket.io';
import QRCode from 'qrcode';
import { logger } from './logger';
import path from 'path';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { handleMessage, handleCall, type HandlerConfig } from './messageHandler';
import { loadPlugins } from './plugins';

const log = logger.child({ module: 'WhatsApp' });

export class WhatsAppManager {
  private socket: WASocket | null = null;
  private io: SocketIOServer;
  private authDir: string;
  private reconnectAttempts = 0;
  private maxReconnects = 3;
  private reconnectDelay = 5000;
  private isShuttingDown = false;
  private pairingPhone: string | null = null;
  private connectionMode: 'qr' | 'code' | null = null;
  private pluginsLoaded = false;
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

  clearSession() {
    try {
      rmSync(this.authDir, { recursive: true, force: true });
      mkdirSync(this.authDir, { recursive: true });
      this.emitLog('info', 'Session cleared — ready for fresh connection', 'Session');
    } catch (err: any) {
      this.emitLog('warn', `Could not clear session: ${err.message}`, 'Session');
    }
  }

  async connect(pairingPhone?: string) {
    this.isShuttingDown = false;

    if (pairingPhone) {
      this.pairingPhone = pairingPhone;
      this.connectionMode = 'code';
    } else if (!this.pairingPhone) {
      this.connectionMode = 'qr';
    }
    // else: reconnecting after 515/logout — keep existing connectionMode and pairingPhone

    // Always close existing socket cleanly before creating a new one
    // to prevent WhatsApp seeing duplicate connections (causes device_removed)
    if (this.socket) {
      try { this.socket.end(undefined); } catch {}
      this.socket = null;
      await new Promise(r => setTimeout(r, 500)); // brief pause to let WA close TCP
    }

    this.emitLog('info', 'Initializing Baileys WhatsApp connection...', 'Baileys');

    if (!this.pluginsLoaded) {
      try {
        await loadPlugins();
        this.pluginsLoaded = true;
        this.emitLog('success', 'Plugins ready', 'PluginLoader');
      } catch (err: any) {
        this.emitLog('warn', `Plugin load warning: ${err.message}`, 'PluginLoader');
      }
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
      // Must use official Browsers preset — custom strings cause WhatsApp to reject pairing codes
      browser: Browsers.ubuntu('Chrome'),
      generateHighQualityLinkPreview: false,
      getMessage: async () => undefined,
      syncFullHistory: false,
      // Give 5 minutes per QR cycle so socket stays alive while user enters pairing code
      qrTimeout: 300_000,
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
        const boomErr = lastDisconnect?.error as Boom;
        const reason = boomErr?.output?.statusCode;
        const errMsg = (boomErr?.message ?? '').toLowerCase();
        const isLoggedOut = reason === DisconnectReason.loggedOut;
        const isDeviceRemoved = errMsg.includes('device_removed') || errMsg.includes('conflict');
        const isForbidden = reason === 401;

        this.socket = null;

        // 515 = "Stream Errored (restart required)" — WhatsApp sends this right after
        // successful pairing to force a clean reconnect. Reconnect immediately, DO NOT clear session.
        const isRestartRequired = reason === 515 || errMsg.includes('restart required');
        if (isRestartRequired && !this.isShuttingDown) {
          this.emitLog('info', 'WhatsApp requested reconnect after pairing — reconnecting...', 'Baileys');
          setTimeout(() => this.connect(), 1000); // reconnect quickly with saved credentials
          return;
        }

        this.emit('disconnected', { reason });

        if (isLoggedOut || isDeviceRemoved || (isForbidden && !isRestartRequired)) {
          // Session was rejected or device removed — clear so user can start fresh
          this.clearSession();
          this.pairingPhone = null;
          this.connectionMode = null;
          this.emitLog('warn', 'Session rejected by WhatsApp — cleared. Please reconnect.', 'Baileys');
          this.emit('sessionCleared');
          this.reconnectAttempts = 0;
          return;
        }

        const isQrTimeout = reason === DisconnectReason.timedOut || reason === 408;

        if (isQrTimeout && this.connectionMode === 'code') {
          // QR timed out while waiting for pairing code entry — clear and inform user
          this.emitLog('warn', 'Connection timed out. If you got a pairing code, it may have expired. Please try again.', 'Pairing');
          this.clearSession();
          this.emit('sessionCleared');
          this.reconnectAttempts = 0;
          return;
        }

        if (!this.isShuttingDown && this.reconnectAttempts < this.maxReconnects) {
          this.reconnectAttempts++;
          const delay = this.reconnectDelay * this.reconnectAttempts;
          this.emitLog('info', `Reconnecting in ${delay / 1000}s (attempt ${this.reconnectAttempts}/${this.maxReconnects})`, 'Baileys');
          setTimeout(() => this.connect(), delay);
        } else {
          this.emitLog('warn', `Connection closed (reason: ${reason ?? 'unknown'}). Please reconnect manually.`, 'Baileys');
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
      }
      if (action === 'remove' && this.config.goodbyeMessage) {
        for (const jid of participants) {
          await sock.sendMessage(id, {
            text: `👋 *Goodbye!*\n\n@${jid.split('@')[0]} has left the group. We'll miss you!`,
            mentions: [jid],
          }).catch(() => {});
        }
      }
    });

    // Request pairing code if phone provided
    if (pairingPhone && !sock.authState.creds.registered) {
      setTimeout(async () => {
        try {
          const cleanPhone = pairingPhone.replace(/[^0-9]/g, '');
          this.emitLog('info', `Requesting pairing code for +${cleanPhone}...`, 'Pairing');
          const code = await sock.requestPairingCode(cleanPhone);
          // Format code as XXXX-XXXX for readability
          const formatted = code.length === 8 ? `${code.slice(0, 4)}-${code.slice(4)}` : code;
          this.emit('pairingCode', formatted);
          this.emitLog('success', `Pairing code ready: ${formatted} — enter it in WhatsApp now`, 'Pairing');
        } catch (err: any) {
          this.emitLog('error', `Failed to get pairing code: ${err.message}`, 'Pairing');
          this.emit('pairingCodeError', err.message);
        }
      }, 5000); // 5s to ensure connection is fully established before requesting code
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
      this.emitLog('info', 'Bot disconnected', 'Baileys');
    }
  }

  async logout() {
    this.isShuttingDown = true;
    if (this.socket) {
      await this.socket.logout().catch(() => {});
      this.socket.end(undefined);
      this.socket = null;
    }
    this.clearSession();
    this.emit('disconnected', { reason: 'logout' });
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
