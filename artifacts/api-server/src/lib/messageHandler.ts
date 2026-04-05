import type { WASocket, BaileysEventMap } from '@whiskeysockets/baileys';
import { logger } from './logger';
import { getPlugin, getPluginStates, incrementPluginUsage } from './plugins';
import { upsertUser } from './database';

let _store: any = null;
async function getStore() {
  if (!_store) {
    try {
      _store = (await import('../../lib/lightweight_store.js')).default;
    } catch {}
  }
  return _store;
}

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
  onStats: (inc: Partial<{ messagesReceived: number; commandsExecuted: number; activeUsers: number; errorsToday: number }>) => void,
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

      const rawSenderId = isGroup
        ? (msg.key.participant || msg.key.remoteJid)!
        : (fromMe ? sock.user?.id! : chatId);

      // Resolve LID-based JIDs to phone-number JIDs for group messages.
      // Modern WhatsApp uses @lid JIDs (e.g. 12345:0@lid) for group participants
      // instead of phone-number JIDs. We try to resolve via group metadata.
      let senderId = rawSenderId;
      if (isGroup && rawSenderId.endsWith('@lid')) {
        try {
          const meta = await sock.groupMetadata(chatId);
          const senderLidBare = rawSenderId.split('@')[0].split(':')[0];
          const match = (meta.participants || []).find((p: any) => {
            const pLidBare = (p.lid || '').split('@')[0].split(':')[0];
            return pLidBare === senderLidBare;
          });
          if (match?.id) senderId = match.id;
        } catch {}
      }

      const ownerNumber = config.ownerNumber
        ? config.ownerNumber.replace(/[^0-9]/g, '')
        : null;
      const senderNumber = senderId.split('@')[0].split(':')[0];

      // Also check LID match: the bot's own LID belongs to the owner's account.
      // When the owner sends from a group, their LID bare matches the bot's LID bare.
      const botLidBare = (sock.user?.lid || '').split('@')[0].split(':')[0];
      const senderLidBare = rawSenderId.endsWith('@lid')
        ? rawSenderId.split('@')[0].split(':')[0]
        : '';

      const isOwner = ownerNumber
        ? (senderNumber === ownerNumber ||
           senderId.includes(ownerNumber) ||
           (botLidBare && senderLidBare && senderLidBare === botLidBare))
        : false;

      if (!fromMe) {
        onStats({ messagesReceived: 1});
        upsertUser(senderId, undefined, 'main').catch(() => {});
      }

      // Sync bot mode from store (set via .mode command on WhatsApp)
      try {
        const store = await getStore();
        if (store) {
          const botMode = await store.getBotMode();
          if (botMode === 'self' || botMode === 'private') {
            config.selfMode = true;
            config.publicMode = false;
          } else if (botMode === 'public') {
            config.selfMode = false;
            config.publicMode = true;
          } else if (botMode === 'groups') {
            config.selfMode = false;
            config.publicMode = false;
          } else if (botMode === 'inbox') {
            config.selfMode = false;
            config.publicMode = false;
          }
        }
      } catch {}

      if (config.selfMode && !fromMe) continue;
      if (!config.publicMode && !isOwner && !fromMe) continue;

      // Handle groups/inbox modes
      try {
        const store = await getStore();
        if (store) {
          const botMode = await store.getBotMode();
          if (botMode === 'groups' && !isGroup && !isOwner && !fromMe) continue;
          if (botMode === 'inbox' && isGroup && !isOwner && !fromMe) continue;
        }
      } catch {}

      if (config.autoRead && !fromMe) {
        await sock.readMessages([msg.key]).catch(() => {});
      }

      // Unwrap all message layers — modern WhatsApp wraps messages in ephemeral,
      // viewOnce, documentWithCaption, and other containers.
      const inner =
        msg.message?.ephemeralMessage?.message ||
        msg.message?.viewOnceMessage?.message ||
        msg.message?.viewOnceMessageV2?.message?.viewOnceMessage?.message ||
        msg.message?.documentWithCaptionMessage?.message ||
        msg.message?.editedMessage?.message?.protocolMessage?.editedMessage ||
        msg.message;

      const text =
        inner?.conversation ||
        inner?.extendedTextMessage?.text ||
        inner?.imageMessage?.caption ||
        inner?.videoMessage?.caption ||
        inner?.documentMessage?.caption ||
        inner?.buttonsResponseMessage?.selectedDisplayText ||
        inner?.listResponseMessage?.title ||
        inner?.templateButtonReplyMessage?.selectedId ||
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

      // Build prefix list — always include '.' and '!' as fallbacks,
      // skip empty-string prefix to avoid treating every message as a command.
      const prefixes = [...new Set([config.prefix, '.', '!', '/'].filter(p => p && p.trim().length > 0))];
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
        isOwner: isOwner || fromMe,
        isAdmin: false,
        config,
        pluginStates,
        channelInfo: {},
      };

      try {
        onLog('info', `CMD: ${usedPrefix}${cmdLower} from ${senderId.split('@')[0]}`, 'Commands');
        onStats({ commandsExecuted: 1 });
        incrementPluginUsage(cmdLower);
        await plugin.handler(sock, msg, args, context);

        if (config.autoReact) {
          await sock.sendMessage(chatId, { react: { text: '✅', key: msg.key } }).catch(() => {});
        }
      } catch (err: any) {
        log.error({ cmd: cmdLower, err: err.message }, 'Plugin handler error');
        onLog('error', `Plugin ${cmdLower} error: ${err.message}`, 'Commands');
        onStats({ errorsToday: 1 });
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
