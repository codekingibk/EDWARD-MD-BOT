import { existsSync, mkdirSync, readdirSync, writeFileSync, readFileSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { logger } from './logger';
import { createRequire } from 'module';
import { pathToFileURL } from 'url';
import { Module } from 'module';

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

/** Convert a cmd()-style handler to our PluginDef handler format. */
function wrapCmdHandler(
  handler: (conn: any, mek: any, m: any, helpers: any) => Promise<void>
): PluginDef['handler'] {
  return async (sock: any, message: any, args: string[], context: PluginContext) => {
    const { chatId, senderId, isGroup, isOwner, isAdmin, config } = context;
    const q = args.join(' ');
    const reply = (text: string) =>
      sock.sendMessage(chatId, { text: String(text) }, { quoted: message }).catch(() => {});

    const m: any = {
      sender: senderId,
      chat: chatId,
      isGroup,
      quoted: (message.message?.extendedTextMessage?.contextInfo?.quotedMessage)
        ? { sender: message.message.extendedTextMessage.contextInfo.participant || senderId }
        : null,
    };

    const helpers = {
      from: chatId,
      q,
      quoted: m.quoted,
      body: (message.message?.conversation || message.message?.extendedTextMessage?.text || ''),
      isCmd: true,
      args,
      isGroup,
      isOwner,
      isAdmin,
      isBotAdmins: false,
      senderNumber: senderId.split('@')[0].split(':')[0],
      reply,
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
      if (!plugin?.command || typeof plugin?.handler !== 'function') continue;

      loadedPlugins.set(plugin.command, plugin);
      if (plugin.aliases) {
        for (const alias of plugin.aliases) {
          loadedPlugins.set(alias, plugin);
        }
      }

      if (!pluginsMeta[plugin.command]) {
        pluginsMeta[plugin.command] = {
          name: plugin.command,
          category: plugin.category || 'general',
          description: plugin.description || '',
          enabled: pluginStates[plugin.command] !== false,
        };
      }

      if (!pluginUsageStats.has(plugin.command)) {
        pluginUsageStats.set(plugin.command, 0);
      }

      ((globalThis as any)._pluginRegistry as any[]).push({
        command: plugin.command,
        category: plugin.category || 'general',
        description: plugin.description || '',
        aliases: plugin.aliases || [],
      });

      loaded++;
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
