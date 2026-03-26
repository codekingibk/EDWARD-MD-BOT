import type { WASocket, BaileysEventMap } from '@whiskeysockets/baileys';
import { logger } from './logger';
import { getPlugin, getPluginStates } from './plugins';

const log = logger.child({ module: 'MessageHandler' });

export interface HandlerConfig {
  prefix: string;
  botName: string;
  ownerNumber: string;
  publicMode: boolean;
  selfMode: boolean;
  autoRead: boolean;
  autoTyping: boolean;
  antiCall: boolean;
  antiLink: boolean;
  antiSpam: boolean;
  autoReact: boolean;
  statusSeen: boolean;
  [key: string]: any;
}

const spamMap = new Map<string, number[]>();

function isSpam(jid: string, limit = 5, window = 10000): boolean {
  const now = Date.now();
  const times = spamMap.get(jid) || [];
  const recent = times.filter(t => now - t < window);
  recent.push(now);
  spamMap.set(jid, recent);
  return recent.length > limit;
}

export async function handleMessage(
  sock: WASocket,
  upsert: BaileysEventMap['messages.upsert'],
  config: HandlerConfig,
  onStats: (inc: Partial<{ messagesReceived: number; commandsExecuted: number; activeUsers: number }>) => void,
  onLog: (level: string, msg: string, src?: string) => void,
): Promise<void> {
  const { messages, type } = upsert;
  if (type !== 'notify') return;

  for (const msg of messages) {
    try {
      const chatId = msg.key.remoteJid!;
      if (!chatId) continue;

      const isGroup = chatId.endsWith('@g.us');
      const isStatus = chatId === 'status@broadcast';
      const fromMe = msg.key.fromMe;

      if (isStatus) {
        if (config.statusSeen && !fromMe) {
          await sock.readMessages([msg.key]).catch(() => {});
        }
        continue;
      }

      const senderId = isGroup
        ? (msg.key.participant || msg.key.remoteJid)!
        : (fromMe ? sock.user?.id! : chatId);

      const ownerJid = config.ownerNumber
        ? config.ownerNumber.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
        : null;
      const isOwner = ownerJid ? senderId.includes(ownerJid.split('@')[0]) : false;

      if (!fromMe) {
        onStats({ messagesReceived: 1 });
      }

      if (config.selfMode && !fromMe) continue;
      if (!config.publicMode && !isOwner && !fromMe) continue;

      if (config.autoRead && !fromMe) {
        await sock.readMessages([msg.key]).catch(() => {});
      }

      const text =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption ||
        msg.message?.videoMessage?.caption ||
        '';

      if (!text) continue;

      if (config.antiSpam && !isOwner && !fromMe) {
        if (isSpam(senderId)) {
          onLog('warn', `Spam detected from ${senderId}`, 'AntiSpam');
          await sock.sendMessage(chatId, { text: '⚠️ You are sending messages too fast! Please slow down.' }, { quoted: msg }).catch(() => {});
          continue;
        }
      }

      if (config.antiLink && isGroup && !isOwner && !fromMe) {
        const linkRegex = /(https?:\/\/|www\.|t\.me\/|chat\.whatsapp\.com\/)/i;
        if (linkRegex.test(text)) {
          onLog('warn', `Link detected from ${senderId} in group`, 'AntiLink');
          await sock.sendMessage(chatId, { delete: msg.key }).catch(() => {});
          await sock.sendMessage(chatId, { text: '🚫 Links are not allowed in this group!' }).catch(() => {});
          continue;
        }
      }

      const prefixes = [config.prefix, '!', '/'];
      let isCommand = false;
      let usedPrefix = '';
      let commandBody = '';

      for (const p of prefixes) {
        if (text.startsWith(p)) {
          isCommand = true;
          usedPrefix = p;
          commandBody = text.slice(p.length).trim();
          break;
        }
      }

      if (!isCommand) continue;

      const [command, ...args] = commandBody.split(/\s+/);
      const cmdLower = command.toLowerCase();

      const plugin = getPlugin(cmdLower);
      const pluginStates = getPluginStates();

      if (!plugin) continue;

      if (pluginStates[plugin.command] === false) {
        await sock.sendMessage(chatId, { text: `❌ The command \`${usedPrefix}${cmdLower}\` is currently disabled.` }, { quoted: msg }).catch(() => {});
        continue;
      }

      if (plugin.ownerOnly && !isOwner && !fromMe) {
        await sock.sendMessage(chatId, { text: '🚫 This command is for the bot owner only.' }, { quoted: msg }).catch(() => {});
        continue;
      }

      if (plugin.groupOnly && !isGroup) {
        await sock.sendMessage(chatId, { text: '📋 This command can only be used in groups.' }, { quoted: msg }).catch(() => {});
        continue;
      }

      if (plugin.privateOnly && isGroup) {
        await sock.sendMessage(chatId, { text: '📱 This command can only be used in private chat.' }, { quoted: msg }).catch(() => {});
        continue;
      }

      if (config.autoTyping) {
        await sock.sendPresenceUpdate('composing', chatId).catch(() => {});
      }

      const context = {
        chatId,
        senderId,
        isGroup,
        isOwner,
        isAdmin: false,
        config,
        pluginStates,
        channelInfo: {},
      };

      try {
        onLog('info', `CMD: ${usedPrefix}${cmdLower} from ${senderId.split('@')[0]}`, 'Commands');
        onStats({ commandsExecuted: 1 });
        await plugin.handler(sock, msg, args, context);

        if (config.autoReact) {
          await sock.sendMessage(chatId, { react: { text: '✅', key: msg.key } }).catch(() => {});
        }
      } catch (err: any) {
        log.error({ cmd: cmdLower, err: err.message }, 'Plugin handler error');
        onLog('error', `Plugin ${cmdLower} error: ${err.message}`, 'Commands');
        await sock.sendMessage(chatId, { text: `❌ Error running command: ${err.message}` }, { quoted: msg }).catch(() => {});
      } finally {
        if (config.autoTyping) {
          await sock.sendPresenceUpdate('paused', chatId).catch(() => {});
        }
      }
    } catch (err: any) {
      log.error({ err: err.message }, 'Error handling message');
    }
  }
}

export async function handleCall(
  sock: WASocket,
  calls: any[],
  config: HandlerConfig,
  onLog: (level: string, msg: string, src?: string) => void,
): Promise<void> {
  if (!config.antiCall) return;
  for (const call of calls) {
    if (call.status === 'offer') {
      onLog('warn', `Rejected call from ${call.from}`, 'AntiCall');
      await sock.rejectCall(call.id, call.from).catch(() => {});
      await sock.sendMessage(call.from, {
        text: `📵 *Auto-Reject*\n\nCalls are not allowed. Please use text messages.`,
      }).catch(() => {});
    }
  }
}
