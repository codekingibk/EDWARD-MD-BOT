import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, Browsers } from '@whiskeysockets/baileys';
import type { WASocket, ConnectionState, BaileysEventMap } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import type { Server as SocketIOServer } from 'socket.io';
import QRCode from 'qrcode';
import { logger } from './logger';
import path from 'path';
import os from 'os';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { handleMessage, handleCall, type HandlerConfig } from './messageHandler';
import { loadPlugins } from './plugins';

const log = logger.child({ module: 'WhatsApp' });

const HISTORY_SIZE = 12;

let prevCpuUsage = process.cpuUsage();
let prevCpuTime = Date.now();

function getCpuPercent(): number {
  const now = Date.now();
  const elapsed = now - prevCpuTime;
  if (elapsed < 100) return 0;
  const cpu = process.cpuUsage(prevCpuUsage);
  prevCpuUsage = process.cpuUsage();
  prevCpuTime = now;
  const used = (cpu.user + cpu.system) / 1000;
  return Math.min(100, Math.round((used / elapsed) * 100 * 10) / 10);
}

function getMemPercent(): number {
  const used = process.memoryUsage().rss;
  const total = os.totalmem();
  return Math.round((used / total) * 1000) / 10;
}

export class WhatsAppManager {
  private socket: WASocket | null = null;
  private io: SocketIOServer;
  private authDir: string;
  private reconnectAttempts = 0;
  private maxReconnects = 999;
  private reconnectDelay = 5000;
  private maxReconnectDelay = 60000;
  private isShuttingDown = false;
  private pairingPhone: string | null = null;
  private connectionMode: 'qr' | 'code' | null = null;
  private pluginsLoaded = false;
  private watchdogInterval: ReturnType<typeof setInterval> | null = null;
  private statsInterval: ReturnType<typeof setInterval> | null = null;
  private isConnected = false;

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
    errorsToday: 0,
    startTime: Date.now(),
  };

  private history = {
    messages: new Array<number>(HISTORY_SIZE).fill(0),
    commands: new Array<number>(HISTORY_SIZE).fill(0),
    users: new Array<number>(HISTORY_SIZE).fill(0),
    timestamps: new Array<number>(HISTORY_SIZE).fill(0),
  };

  private historyInterval: ReturnType<typeof setInterval> | null = null;
  private lastMsgCount = 0;
  private lastCmdCount = 0;
  private lastUserCount = 0;

  constructor(io: SocketIOServer) {
    this.io = io;
    this.authDir = path.resolve(process.cwd(), 'wa-auth');
    if (!existsSync(this.authDir)) {
      mkdirSync(this.authDir, { recursive: true });
    }
    this.startStatsInterval();
    this.startHistoryTracking();
  }

  private startStatsInterval() {
    if (this.statsInterval) clearInterval(this.statsInterval);
    this.statsInterval = setInterval(() => {
      if (this.isConnected) this.emitStats();
    }, 5000);
  }

  private startHistoryTracking() {
    if (this.historyInterval) clearInterval(this.historyInterval);
    this.historyInterval = setInterval(() => {
      const msgDelta = this.stats.messagesReceived - this.lastMsgCount;
      const cmdDelta = this.stats.commandsExecuted - this.lastCmdCount;
      this.lastMsgCount = this.stats.messagesReceived;
      this.lastCmdCount = this.stats.commandsExecuted;
      this.lastUserCount = this.stats.activeUsers;

      this.history.messages.push(msgDelta);
      this.history.commands.push(cmdDelta);
      this.history.users.push(this.stats.activeUsers);
      this.history.timestamps.push(Date.now());

      if (this.history.messages.length > HISTORY_SIZE) {
        this.history.messages.shift();
        this.history.commands.shift();
        this.history.users.shift();
        this.history.timestamps.shift();
      }
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private startWatchdog() {
    if (this.watchdogInterval) clearInterval(this.watchdogInterval);
    this.watchdogInterval = setInterval(async () => {
      if (this.isShuttingDown) return;
      const sockUser = this.socket?.user;
      if (!sockUser && !this.isShuttingDown) {
        this.emitLog('warn', 'Watchdog: connection lost, attempting reconnect...', 'Watchdog');
        this.isConnected = false;
        this.emit('disconnected', { reason: 'watchdog' });
        try {
          await this.connect(this.pairingPhone || undefined);
        } catch (err: any) {
          this.emitLog('error', `Watchdog reconnect failed: ${err.message}`, 'Watchdog');
        }
      }
    }, 30000);
  }

  private stopWatchdog() {
    if (this.watchdogInterval) {
      clearInterval(this.watchdogInterval);
      this.watchdogInterval = null;
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

    if (this.socket) {
      try { this.socket.end(undefined); } catch {}
      this.socket = null;
      await new Promise(r => setTimeout(r, 500));
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
      browser: Browsers.ubuntu('Chrome'),
      generateHighQualityLinkPreview: false,
      getMessage: async () => undefined,
      syncFullHistory: false,
      qrTimeout: 300_000,
      keepAliveIntervalMs: 15000,
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
        this.isConnected = false;

        const isRestartRequired = reason === 515 || errMsg.includes('restart required');
        if (isRestartRequired && !this.isShuttingDown) {
          this.emitLog('info', 'WhatsApp requested reconnect after pairing — reconnecting...', 'Baileys');
          setTimeout(() => this.connect(), 1000);
          return;
        }

        this.emit('disconnected', { reason });

        if (isLoggedOut || isDeviceRemoved || (isForbidden && !isRestartRequired)) {
          this.clearSession();
          this.pairingPhone = null;
          this.connectionMode = null;
          this.emitLog('warn', 'Session rejected by WhatsApp — cleared. Please reconnect.', 'Baileys');
          this.emit('sessionCleared');
          this.reconnectAttempts = 0;
          this.stopWatchdog();
          return;
        }

        const isQrTimeout = reason === DisconnectReason.timedOut || reason === 408;
        if (isQrTimeout && this.connectionMode === 'code') {
          this.emitLog('warn', 'Connection timed out. If you got a pairing code, it may have expired. Please try again.', 'Pairing');
          this.clearSession();
          this.emit('sessionCleared');
          this.reconnectAttempts = 0;
          return;
        }

        if (!this.isShuttingDown) {
          this.reconnectAttempts++;
          const delay = Math.min(this.reconnectDelay * Math.min(this.reconnectAttempts, 10), this.maxReconnectDelay);
          this.emitLog('info', `Reconnecting in ${delay / 1000}s (attempt ${this.reconnectAttempts})`, 'Baileys');
          setTimeout(() => {
            if (!this.isShuttingDown) this.connect();
          }, delay);
        }
      } else if (connection === 'connecting') {
        this.emitLog('info', 'Connecting to WhatsApp...', 'Baileys');
      } else if (connection === 'open') {
        this.reconnectAttempts = 0;
        this.isConnected = true;
        this.emit('connected', { jid: sock.user?.id, name: sock.user?.name });
        this.emitLog('success', `Connected as ${sock.user?.name ?? sock.user?.id}`, 'Baileys');
        if (this.config.alwaysOnline) {
          await sock.sendPresenceUpdate('available').catch(() => {});
        }
        this.startWatchdog();
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

    if (pairingPhone && !sock.authState.creds.registered) {
      setTimeout(async () => {
        try {
          const cleanPhone = pairingPhone.replace(/[^0-9]/g, '');
          this.emitLog('info', `Requesting pairing code for +${cleanPhone}...`, 'Pairing');
          const code = await sock.requestPairingCode(cleanPhone);
          const formatted = code.length === 8 ? `${code.slice(0, 4)}-${code.slice(4)}` : code;
          this.emit('pairingCode', formatted);
          this.emitLog('success', `Pairing code ready: ${formatted} — enter it in WhatsApp now`, 'Pairing');
        } catch (err: any) {
          this.emitLog('error', `Failed to get pairing code: ${err.message}`, 'Pairing');
          this.emit('pairingCodeError', err.message);
        }
      }, 5000);
    }

    return sock;
  }

  private emitStats() {
    const uptime = Date.now() - this.stats.startTime;
    const memUsed = process.memoryUsage().rss;
    const memTotal = os.totalmem();
    const memPercent = Math.round((memUsed / memTotal) * 1000) / 10;
    const cpuPercent = getCpuPercent();

    this.emit('stats', {
      messagesReceived: this.stats.messagesReceived,
      messagesSent: this.stats.messagesSent,
      commandsExecuted: this.stats.commandsExecuted,
      activeGroups: this.stats.activeGroups,
      activeUsers: this.stats.activeUsers,
      errorsToday: this.stats.errorsToday,
      uptime,
      startTime: this.stats.startTime,
      memoryUsage: memPercent,
      cpuUsage: cpuPercent,
      memoryUsedMB: Math.round(memUsed / 1024 / 1024),
      memoryTotalMB: Math.round(memTotal / 1024 / 1024),
      history: {
        messages: [...this.history.messages],
        commands: [...this.history.commands],
        users: [...this.history.users],
      },
    });
  }

  getStats() {
    const uptime = Date.now() - this.stats.startTime;
    const memUsed = process.memoryUsage().rss;
    const memTotal = os.totalmem();
    const memPercent = Math.round((memUsed / memTotal) * 1000) / 10;
    const cpuPercent = getCpuPercent();

    return {
      ...this.stats,
      uptime,
      connected: this.isConnected,
      memoryUsage: memPercent,
      cpuUsage: cpuPercent,
      memoryUsedMB: Math.round(memUsed / 1024 / 1024),
      memoryTotalMB: Math.round(memTotal / 1024 / 1024),
      history: {
        messages: [...this.history.messages],
        commands: [...this.history.commands],
        users: [...this.history.users],
      },
    };
  }

  async disconnect() {
    this.isShuttingDown = true;
    this.isConnected = false;
    this.stopWatchdog();
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
    this.isConnected = false;
    this.stopWatchdog();
    if (this.socket) {
      await this.socket.logout().catch(() => {});
      this.socket.end(undefined);
      this.socket = null;
    }
    this.clearSession();
    this.emit('disconnected', { reason: 'logout' });
  }

  async restart() {
    this.stopWatchdog();
    await this.disconnect();
    this.isShuttingDown = false;
    await this.connect(this.pairingPhone || undefined);
  }

  getStatus() {
    return {
      connected: this.isConnected && this.socket?.user != null,
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
