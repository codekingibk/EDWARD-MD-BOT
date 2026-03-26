import type { WASocket } from '@whiskeysockets/baileys';
import { logger } from './logger';

const log = logger.child({ module: 'Notifier' });

let _socket: WASocket | null = null;
let _ownerNumber = '';
let _botName = 'EDWARD MD';

export function setNotifierSocket(sock: WASocket | null) {
  _socket = sock;
}

export function setNotifierConfig(ownerNumber: string, botName?: string) {
  _ownerNumber = ownerNumber;
  if (botName) _botName = botName;
}

function getOwnerJid(): string | null {
  if (!_ownerNumber) return null;
  const clean = _ownerNumber.replace(/[^0-9]/g, '');
  if (!clean) return null;
  return `${clean}@s.whatsapp.net`;
}

async function send(text: string) {
  const jid = getOwnerJid();
  if (!jid || !_socket) return;
  try {
    await _socket.sendMessage(jid, { text });
    log.info({ jid }, 'Notification sent to owner');
  } catch (err: any) {
    log.warn({ err: err.message }, 'Failed to send notification');
  }
}

function ts() {
  return new Date().toLocaleTimeString('en-US', { hour12: false });
}

export async function notifyConnected(user: { name?: string; id?: string }, pluginCount: number) {
  await send(
    `╭━━━━━━━━━━━━━━━━━━━━━━╮\n` +
    `┃  🤖 *${_botName}*\n` +
    `┃  ✅ *Connected Successfully*\n` +
    `╰━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
    `👤 *Account:* ${user.name ?? user.id ?? 'Unknown'}\n` +
    `🔌 *Plugins Loaded:* ${pluginCount}\n` +
    `🕐 *Time:* ${ts()}\n\n` +
    `_Bot is now online and ready to serve!_`
  );
}

export async function notifySettingsUpdated(changes: Record<string, any>) {
  const pretty: Record<string, string> = {
    botName: 'Bot Name', prefix: 'Prefix', publicMode: 'Public Mode',
    selfMode: 'Self Mode', antiCall: 'Anti-Call', antiLink: 'Anti-Link',
    antiSpam: 'Anti-Spam', autoRead: 'Auto Read', autoTyping: 'Auto Typing',
    autoReact: 'Auto React', statusSeen: 'Status Seen', statusReply: 'Status Reply',
    alwaysOnline: 'Always Online', antiDelete: 'Anti-Delete',
    antiViewOnce: 'Anti-ViewOnce', welcomeMessage: 'Welcome Message',
    goodbyeMessage: 'Goodbye Message', language: 'Language',
    ownerNumber: 'Owner Number',
  };

  const lines = Object.entries(changes)
    .filter(([k]) => pretty[k] !== undefined)
    .map(([k, v]) => {
      const label = pretty[k] ?? k;
      const val = typeof v === 'boolean' ? (v ? '✅ ON' : '❌ OFF') : String(v);
      return `• *${label}:* ${val}`;
    });

  if (lines.length === 0) return;

  await send(
    `⚙️ *Settings Updated*\n\n` +
    lines.join('\n') +
    `\n\n_Updated at ${ts()}_`
  );
}

export async function notifyPluginToggled(pluginName: string, command: string, enabled: boolean) {
  await send(
    `🔌 *Plugin ${enabled ? 'Enabled' : 'Disabled'}*\n\n` +
    `📦 *Plugin:* ${pluginName}\n` +
    `⌨️ *Command:* .${command}\n` +
    `🔘 *Status:* ${enabled ? '✅ Enabled' : '❌ Disabled'}\n\n` +
    `_Changed at ${ts()}_`
  );
}

export async function notifyPluginsReloaded(total: number, loaded: number) {
  await send(
    `🔄 *Plugins Reloaded*\n\n` +
    `✅ *Loaded:* ${loaded}/${total}\n` +
    (loaded < total ? `⚠️ *Failed:* ${total - loaded}\n` : '') +
    `\n_Reloaded at ${ts()}_`
  );
}

export async function notifyModeChanged(mode: string) {
  await send(
    `🔒 *Bot Mode Changed*\n\n` +
    `Current Mode: *${mode.toUpperCase()}*\n\n` +
    `_Changed at ${ts()}_`
  );
}
