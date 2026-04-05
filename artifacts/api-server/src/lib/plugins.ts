import { existsSync, mkdirSync, readdirSync, writeFileSync, readFileSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { logger } from './logger';
import { createRequire } from 'module';
import { pathToFileURL } from 'url';
import { Module } from 'module';
import { getContentType, downloadMediaMessage } from '@whiskeysockets/baileys';

const log = logger.child({ module: 'PluginLoader' });

export interface PluginDef {
  command: string;
  aliases?: string[];
  category?: string;
  description?: string;
  usage?: string;
  ownerOnly?: boolean;
  adminOnly?: boolean;
  groupOnly?: boolean;
  privateOnly?: boolean;
  isPrefixless?: boolean;
  handler: (sock: any, message: any, args: string[], context: PluginContext) => Promise<void>;
}

export interface PluginContext {
  chatId: string;
  senderId: string;
  isGroup: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  isBotAdmin: boolean;
  config: Record<string, any>;
  channelInfo?: Record<string, any>;
  pluginStates: Record<string, boolean>;
}

const PLUGINS_DIR = path.resolve(process.cwd(), 'plugins');
const PLUGINS_META_FILE = path.resolve(process.cwd(), 'plugins-meta.json');
const MEGA_MD_BASE = 'https://raw.githubusercontent.com/GlobalTechInfo/MEGA-MD/main/plugins';

const PLUGIN_FILES = [
  'alive.js', 'ping.js', 'uptime.js', 'calc.js', 'joke.js', 'fact.js', 'quote.js',
  'weather.js', 'translate.js', 'wikipedia.js', 'define.js', 'news.js', 'movie.js',
  'lyrics.js', 'tts.js', 'sticker.js', 'menu.js', 'help.js', 'listcmd.js',
  'broadcast.js', 'ban.js', 'kick.js', 'promote.js', 'demote.js', 'mute.js',
  'unmute.js', 'hidetag.js', 'groupinfo.js', 'invitelink.js', 'joingroup.js',
  'welcome.js', 'goodbye.js', 'anticall.js', 'antidelete.js', 'antilink.js',
  'antispam.js', 'antibadword.js', 'autoread.js', 'autotyping.js', 'autostatus.js',
  'cmdreact.js', 'areact.js', 'viewonce.js', 'delete.js', 'echo.js',
  'flip.js', 'eightball.js', 'truth.js', 'dare.js', 'trivia.js', 'hangman.js',
  'tictactoe.js', 'math.js', 'base64.js', 'cipher.js', 'url.js', 'urldecode.js',
  'iplookup.js', 'whois.js', 'npmstalk.js', 'github.js', 'gitinfo.js',
  'imdb.js', 'pokedex.js', 'genshin.js', 'anime.js', 'animes.js',
  'instagram.js', 'tiktok.js', 'twitter.js', 'facebook.js', 'youtube.js',
  'play.js', 'ytsearch.js', 'tts.js', 'tourl.js', 'tiny.js',
  'qrcode.js', 'meme.js', 'gif.js', 'imagine-diffusion.js',
  'warn.js', 'warnings.js', 'notes.js', 'vnote.js', 'poll.js', 'mention.js',
  'fetch.js', 'ping.js', 'pingweb.js', 'update.js', 'cleartmp.js',
  'mode.js', 'owner.js', 'privacy.js', 'pmblocker.js', 'maintenance.js',
  'addreply.js', 'autoreply.js', 'delreply.js', 'listreplies.js',
  'broadcast.js', 'broadcastdm.js', 'pair.js', 'disappear.js',
  'archivechat.js', 'pinchat.js', 'clearchat.js', 'clearsession.js',
  'getpp.js', 'stalk.js', 'gstalk.js', 'pstalk.js',
  'hack.js', 'wasted.js', 'compliment.js', 'insult.js', 'flirt.js',
  'distance.js', 'units.js', 'element.js', 'dna.js', 'medicine.js',
  'wordcloud.js', 'wyr.js', 'why.js', 'quote2.js', 'quoted.js',
];

let loadedPlugins: Map<string, PluginDef> = new Map();
let pluginStates: Record<string, boolean> = {};
let pluginsMeta: Record<string, { name: string; category: string; description: string; enabled: boolean }> = {};
const pluginUsageStats: Map<string, number> = new Map();

function ensureDir() {
  if (!existsSync(PLUGINS_DIR)) mkdirSync(PLUGINS_DIR, { recursive: true });
}

async function downloadPlugin(name: string): Promise<boolean> {
  try {
    const url = `${MEGA_MD_BASE}/${name}`;
    const res = await fetch(url);
    if (!res.ok) return false;
    const code = await res.text();
    if (!code || code.startsWith('404')) return false;
    writeFileSync(path.join(PLUGINS_DIR, name), code, 'utf8');
    return true;
  } catch {
    return false;
  }
}

export async function downloadAllPlugins(onProgress?: (msg: string) => void): Promise<void> {
  ensureDir();
  const existing = new Set(readdirSync(PLUGINS_DIR).filter(f => f.endsWith('.js')));
  const toDownload = PLUGIN_FILES.filter(f => !existing.has(f));

  if (toDownload.length === 0) {
    onProgress?.('All plugins already downloaded');
    return;
  }

  onProgress?.(`Downloading ${toDownload.length} plugins from MEGA-MD...`);

  let success = 0;
  const batchSize = 10;
  for (let i = 0; i < toDownload.length; i += batchSize) {
    const batch = toDownload.slice(i, i + batchSize);
    const results = await Promise.all(batch.map(f => downloadPlugin(f)));
    success += results.filter(Boolean).length;
    onProgress?.(`Downloaded ${success}/${toDownload.length} plugins...`);
  }

  onProgress?.(`Plugin download complete: ${success}/${toDownload.length} successful`);
}

/**
 * Find the inner message content after unwrapping all WhatsApp container layers
 * (ephemeral, viewOnce, documentWithCaption, etc.)
 */
function getInnerMessage(message: any): any {
  return (
    message.message?.ephemeralMessage?.message ||
    message.message?.viewOnceMessage?.message ||
    message.message?.viewOnceMessageV2?.message?.viewOnceMessage?.message ||
    message.message?.documentWithCaptionMessage?.message ||
    message.message?.editedMessage?.message?.protocolMessage?.editedMessage ||
    message.message
  );
}

/**
 * Find contextInfo (which holds the quoted message) from any message layer.
 * Modern WhatsApp nests this inside ephemeral/viewOnce wrappers.
 */
function findContextInfo(message: any): any {
  const inner = getInnerMessage(message);
  if (!inner) return null;

  // Check every known message type that can carry contextInfo
  const candidates = [
    inner.extendedTextMessage,
    inner.imageMessage,
    inner.videoMessage,
    inner.stickerMessage,
    inner.audioMessage,
    inner.documentMessage,
    inner.buttonsResponseMessage,
    inner.listResponseMessage,
  ];
  for (const c of candidates) {
    if (c?.contextInfo?.quotedMessage) return c.contextInfo;
  }
  return null;
}

/**
 * Build a rich `quoted` object (similar to the smsg helper used in classic Baileys bots).
 * Provides: mtype, mimetype, msg (raw content), sender, download(), text
 */
function buildQuotedObject(contextInfo: any, chatId: string, sock: any): any | null {
  const quotedRaw = contextInfo.quotedMessage;
  if (!quotedRaw) return null;

  // Get the actual message type (imageMessage, videoMessage, stickerMessage, …)
  const mtype: string = (getContentType(quotedRaw) as string) || Object.keys(quotedRaw)[0];
  if (!mtype) return null;

  const msgContent: any = quotedRaw[mtype] || {};
  const mimetype: string = msgContent.mimetype || '';

  // Build a minimal WAMessage so downloadMediaMessage can fetch the media
  const fakeMsg = {
    key: {
      remoteJid: contextInfo.remoteJid || chatId,
      fromMe: false,
      id: contextInfo.stanzaId || `q-${Date.now()}`,
      participant: contextInfo.participant,
    },
    message: quotedRaw,
  };

  const quoted: any = {
    mtype,
    mimetype,
    msg: msgContent,
    message: quotedRaw,
    sender: contextInfo.participant || chatId,
    key: fakeMsg.key,
    id: contextInfo.stanzaId || '',
    chat: contextInfo.remoteJid || chatId,
    text: msgContent.text || msgContent.caption || msgContent.conversation || '',
    download: async () => {
      return downloadMediaMessage(fakeMsg as any, 'buffer', {}, {
        reuploadRequest: sock.updateMediaMessage,
      });
    },
  };

  return quoted;
}

function buildChannelContextInfo(config: Record<string, any>): any {
  const channelName = config.menuChannelName || process.env.EDWARD_CHANNEL_NAME || 'EDWARD MD';
  const channelUrl = config.channelUrl || process.env.EDWARD_CHANNEL_URL || 'https://whatsapp.com/channel/0029VbCKeh4JP20wrrsjuz0s';
  return {
    externalAdReply: {
      title: channelName,
      body: `📢 Follow the ${channelName} channel`,
      sourceUrl: channelUrl,
      mediaType: 1,
      renderLargerThumbnail: false,
      showAdAttribution: true,
    },
    forwardingScore: 1,
    isForwarded: true,
  };
}

async function computeGroupInfo(sock: any, chatId: string, senderId: string, isGroup: boolean): Promise<{
  isAdmins: boolean; isBotAdmins: boolean;
  groupMetadata: any; participants: any[]; groupAdmins: any[]; groupName: string;
}> {
  const empty = { isAdmins: false, isBotAdmins: false, groupMetadata: null, participants: [], groupAdmins: [], groupName: '' };
  if (!isGroup) return empty;
  try {
    const metadata = await sock.groupMetadata(chatId);
    const participants = metadata?.participants || [];
    const groupName = metadata?.subject || '';

    const botId: string = sock.user?.id || '';
    const botLid: string = sock.user?.lid || '';
    const bareId = (jid: string) => jid.split('@')[0].split(':')[0];
    const botNumber = bareId(botId);
    const botLidBare = bareId(botLid);

    let resolvedSenderId = senderId;
    if (senderId.endsWith('@lid')) {
      const match = participants.find((p: any) => bareId(p.lid || '') === bareId(senderId));
      if (match?.id) resolvedSenderId = match.id;
    }
    const senderBare = bareId(resolvedSenderId);

    const isAdminRole = (p: any) => p.admin === 'admin' || p.admin === 'superadmin';
    const participantMatches = (p: any, targetBare: string) => {
      const pIdBare = bareId(p.id || '');
      const pLidBare = bareId(p.lid || '');
      return pIdBare === targetBare || pLidBare === targetBare;
    };

    const groupAdmins = participants.filter((p: any) => isAdminRole(p));
    const isAdmins = participants.some((p: any) => participantMatches(p, senderBare) && isAdminRole(p));
    const isBotAdmins = participants.some((p: any) =>
      (participantMatches(p, botNumber) || (botLidBare && participantMatches(p, botLidBare))) && isAdminRole(p)
    );

    return { isAdmins, isBotAdmins, groupMetadata: metadata, participants, groupAdmins, groupName };
  } catch {
    return empty;
  }
}

function wrapCmdHandler(
  handler: (conn: any, mek: any, m: any, helpers: any) => Promise<void>
): PluginDef['handler'] {
  return async (sock: any, message: any, args: string[], context: PluginContext) => {
    const { chatId, senderId, isGroup, isOwner, isAdmin, config } = context;
    const q = args.join(' ');

    // Build the quoted message object — handles ephemeral, viewOnce, and other wrappers
    const contextInfo = findContextInfo(message);
    const quotedObj = contextInfo ? buildQuotedObject(contextInfo, chatId, sock) : null;

    // Augment the raw Baileys message so plugins that access mek.quoted / mek.chat work
    message.chat = chatId;
    message.quoted = quotedObj;

    const channelCtx = buildChannelContextInfo(config);

    const reply = (text: string) =>
      sock.sendMessage(chatId, {
        text: String(text),
        contextInfo: channelCtx,
      }, { quoted: message }).catch(() => {});
    const react = (emoji: string) =>
      sock.sendMessage(chatId, { react: { text: emoji, key: message.key } }).catch(() => {});

    const m: any = {
      key: message.key,
      message: message.message,
      sender: senderId,
      chat: chatId,
      isGroup,
      quoted: quotedObj,
      react: (emoji: string) =>
        sock.sendMessage(chatId, { react: { text: emoji, key: message.key } }).catch(() => {}),
      reply: (text: string) =>
        sock.sendMessage(chatId, {
          text: String(text),
          contextInfo: channelCtx,
        }, { quoted: message }).catch(() => {}),
    };

    const inner = getInnerMessage(message);
    const body =
      inner?.conversation ||
      inner?.extendedTextMessage?.text ||
      inner?.imageMessage?.caption ||
      inner?.videoMessage?.caption ||
      inner?.documentMessage?.caption || '';

    const { isAdmins, isBotAdmins, groupMetadata, participants, groupAdmins, groupName } = await computeGroupInfo(sock, chatId, senderId, isGroup);

    const helpers = {
      from: chatId,
      q,
      quoted: quotedObj,
      body,
      isCmd: true,
      args,
      isGroup,
      isOwner,
      isAdmin: isAdmins,
      isAdmins,
      isBotAdmins,
      groupMetadata,
      participants,
      groupAdmins,
      groupName,
      senderNumber: senderId.split('@')[0].split(':')[0],
      prefix: config?.prefix || '.',
      reply,
      react,
    };

    await handler(sock, message, m, helpers);
  };
}

function registerCmdPlugin(
  meta: any,
  handler: (conn: any, mek: any, m: any, helpers: any) => Promise<void>
) {
  const command: string = (meta.pattern || meta.command || '').toLowerCase();
  if (!command) return;

  const plugin: PluginDef = {
    command,
    aliases: Array.isArray(meta.alias) ? meta.alias.map((a: string) => a.toLowerCase()) : [],
    category: (meta.category || 'general').toLowerCase(),
    description: meta.desc || meta.description || '',
    usage: meta.use || meta.usage || `.${command}`,
    ownerOnly: meta.category === 'owner',
    adminOnly: meta.adminOnly || meta.category === 'admin',
    groupOnly: meta.groupOnly || false,
    handler: wrapCmdHandler(handler),
  };

  loadedPlugins.set(plugin.command, plugin);
  for (const alias of (plugin.aliases || [])) {
    loadedPlugins.set(alias, plugin);
  }
  if (!pluginsMeta[plugin.command]) {
    pluginsMeta[plugin.command] = {
      name: plugin.command,
      category: plugin.category || 'general',
      description: plugin.description || '',
      enabled: pluginStates[plugin.command] !== false,
    };
  }
  if (!pluginUsageStats.has(plugin.command)) pluginUsageStats.set(plugin.command, 0);
  ((globalThis as any)._pluginRegistry as any[]).push({
    command: plugin.command,
    category: plugin.category || 'general',
    description: plugin.description || '',
    aliases: plugin.aliases || [],
  });
}

/** Detect if a plugin file uses CommonJS syntax */
function isCjsPlugin(code: string): boolean {
  return /\brequire\s*\(/.test(code) || /\bmodule\.exports\b/.test(code) || /\bexports\.\w/.test(code);
}

/**
 * Load a CommonJS plugin using Node's internal Module._compile.
 * This bypasses the "type":"module" detection entirely, giving the plugin
 * proper CJS globals (require, module, exports, __filename, __dirname).
 * In Node.js 24, require(esm) is supported, so plugins can still
 * require('../command') which is now a proper ES module.
 */
function loadCjsPlugin(filePath: string, code: string): void {
  const m = new (Module as any)(filePath, null);
  m.filename = filePath;
  m.paths = (Module as any)._nodeModulePaths(path.dirname(filePath));
  (m as any)._compile(code, filePath);
}

export async function loadPlugins(): Promise<void> {
  ensureDir();
  loadedPlugins.clear();
  (globalThis as any)._pluginRegistry = [];

  // Access the command.js shim (CJS module) to drain registered cmd() commands
  const requireRoot = createRequire(path.resolve(process.cwd(), 'package.json'));
  let commandShim: { drainRegistry: () => Array<{ meta: any; handler: any }> } | null = null;
  try {
    commandShim = requireRoot('./command') as any;
    // drain any stale registrations from a previous load
    commandShim!.drainRegistry();
  } catch {}

  const files = readdirSync(PLUGINS_DIR).filter(f => f.endsWith('.js'));
  if (files.length === 0) {
    log.warn('No plugins found in plugins directory');
    return;
  }

  let loaded = 0;
  for (const file of files) {
    try {
      const filePath = path.join(PLUGINS_DIR, file);
      const code = readFileSync(filePath, 'utf8');

      if (isCjsPlugin(code)) {
        // Load as CommonJS using Module._compile (bypasses type:module detection)
        loadCjsPlugin(filePath, code);

        if (commandShim) {
          const registrations = commandShim.drainRegistry();
          for (const { meta, handler } of registrations) {
            registerCmdPlugin(meta, handler);
            loaded++;
          }
        }
        continue;
      }

      // ESM plugin: load via dynamic import
      const url = pathToFileURL(filePath).href + `?t=${Date.now()}`;
      const mod = await import(url);
      const plugin: PluginDef = mod.default || mod;

      // Check for cmd()-style registrations (new plugin format)
      if (commandShim) {
        const registrations = commandShim.drainRegistry();
        if (registrations.length > 0) {
          for (const { meta, handler } of registrations) {
            registerCmdPlugin(meta, handler);
            loaded++;
          }
          continue;
        }
      }

      // Standard ES module plugin format (export default { command, handler })
      // Also supports array exports: export default [{ command, handler }, ...]
      const pluginList: PluginDef[] = Array.isArray(plugin)
        ? plugin
        : (plugin?.command && typeof plugin?.handler === 'function' ? [plugin] : []);

      if (pluginList.length === 0) continue;

      for (const p of pluginList) {
        if (!p?.command || typeof p?.handler !== 'function') continue;
        loadedPlugins.set(p.command, p);
        if (p.aliases) {
          for (const alias of p.aliases) loadedPlugins.set(alias, p);
        }
        if (!pluginsMeta[p.command]) {
          pluginsMeta[p.command] = {
            name: p.command,
            category: p.category || 'general',
            description: p.description || '',
            enabled: pluginStates[p.command] !== false,
          };
        }
        if (!pluginUsageStats.has(p.command)) pluginUsageStats.set(p.command, 0);
        ((globalThis as any)._pluginRegistry as any[]).push({
          command: p.command,
          category: p.category || 'general',
          description: p.description || '',
          aliases: p.aliases || [],
        });
        loaded++;
      }
    } catch (err: any) {
      log.warn({ file, err: err.message }, 'Failed to load plugin');
    }
  }

  log.info({ loaded, total: files.length }, 'Plugins loaded');
}

export function getPlugin(command: string): PluginDef | undefined {
  return loadedPlugins.get(command);
}

export function getAllPluginsMeta(): Record<string, any>[] {
  return Array.from(new Set(
    Array.from(loadedPlugins.values())
  )).map(p => ({
    id: p.command,
    name: p.command,
    category: p.category || 'general',
    description: p.description || '',
    usage: p.usage || `.${p.command}`,
    aliases: p.aliases || [],
    enabled: pluginStates[p.command] !== false,
    ownerOnly: !!p.ownerOnly,
    adminOnly: !!p.adminOnly,
  }));
}

export function setPluginState(id: string, enabled: boolean) {
  pluginStates[id] = enabled;
}

export function getPluginStates() { return pluginStates; }

export function getLoadedPlugins() { return loadedPlugins; }

export function incrementPluginUsage(command: string) {
  const key = command.toLowerCase();
  pluginUsageStats.set(key, (pluginUsageStats.get(key) || 0) + 1);
}

export function getPluginUsageStats(): { command: string; usage: number; category: string }[] {
  const result: { command: string; usage: number; category: string }[] = [];
  for (const [cmd, count] of pluginUsageStats.entries()) {
    const meta = pluginsMeta[cmd];
    result.push({ command: cmd, usage: count, category: meta?.category || 'general' });
  }
  return result.sort((a, b) => b.usage - a.usage);
}
