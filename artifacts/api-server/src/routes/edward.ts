import { Router, type IRouter } from "express";
import type { Server as SocketIOServer } from 'socket.io';
import { logger } from "../lib/logger";
import { getWhatsAppManager } from "../lib/whatsapp";
import { getAllPluginsMeta, setPluginState, downloadAllPlugins, loadPlugins, getPluginUsageStats } from "../lib/plugins";
import { notifySettingsUpdated, notifyPluginToggled, notifyPluginsReloaded } from "../lib/notifier";
import { getAllServers, getUserCount, getServerInfo, isConnected as isDbConnected, CommunityPost } from "../lib/database";
import os from 'os';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import crypto from 'crypto';

// ── Storage paths ─────────────────────────────────────────────────────────────
const STORAGE_BASE = process.env['STORAGE_DIR'] || process.cwd();
const DATA_DIR = path.join(STORAGE_BASE, 'data');
const KEYS_FILE = path.join(DATA_DIR, 'premium-keys.json');
const SERVERS_FILE = path.join(DATA_DIR, 'admin-servers.json');
const UPLOADS_DIR = path.join(STORAGE_BASE, 'uploads');
mkdirSync(DATA_DIR, { recursive: true });
mkdirSync(UPLOADS_DIR, { recursive: true });

// ── Admin Server Records storage ──────────────────────────────────────────────
interface AdminServerRecord {
  id: string;
  name: string;
  ownerNumber: string;
  plan: 'free' | 'premium';
  key: string | null;
  registeredAt: string;
  notes: string;
  usersCount: number;
}

function readServerRecords(): AdminServerRecord[] {
  try { if (existsSync(SERVERS_FILE)) return JSON.parse(readFileSync(SERVERS_FILE, 'utf-8')); } catch {}
  return [];
}
function writeServerRecords(data: AdminServerRecord[]) {
  writeFileSync(SERVERS_FILE, JSON.stringify(data, null, 2));
}

// ── Admin Token Auth ──────────────────────────────────────────────────────────
const ADMIN_SECRET = process.env['ADMIN_SECRET'] || 'edward_md_default_secret';
const ADMIN_EMAIL = process.env['ADMIN_EMAIL'] || 'gboyegaibk@gmail.com';
const ADMIN_PASSWORD = process.env['ADMIN_PASSWORD'] || 'Edward@Admin2024';
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

function generateAdminToken(email: string): string {
  const ts = Date.now().toString();
  const sig = crypto.createHmac('sha256', ADMIN_SECRET).update(`${email}:${ts}`).digest('hex');
  return `${Buffer.from(email).toString('base64')}.${ts}.${sig}`;
}

function verifyAdminToken(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const [emailB64, ts, sig] = parts;
    const email = Buffer.from(emailB64, 'base64').toString();
    if (Date.now() - parseInt(ts) > TOKEN_EXPIRY_MS) return false;
    const expected = crypto.createHmac('sha256', ADMIN_SECRET).update(`${email}:${ts}`).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'));
  } catch { return false; }
}

function requireAdmin(req: any, res: any, next: any) {
  const token = req.headers['x-admin-token'] as string;
  if (!token || !verifyAdminToken(token)) {
    res.status(401).json({ ok: false, error: 'Unauthorized — invalid or expired token' });
    return;
  }
  next();
}

interface PremiumKey { key: string; generated: string; activated: boolean; activatedAt: string | null; }
interface PremiumStore { keys: PremiumKey[]; serverTier: string; activeKey: string | null; }

function readPremiumStore(): PremiumStore {
  try { if (existsSync(KEYS_FILE)) return JSON.parse(readFileSync(KEYS_FILE, 'utf-8')); } catch {}
  return { keys: [], serverTier: 'free', activeKey: null };
}
function writePremiumStore(data: PremiumStore) {
  writeFileSync(KEYS_FILE, JSON.stringify(data, null, 2));
}
function generatePremiumKey(): string {
  const seg = () => crypto.randomBytes(3).toString('hex').toUpperCase();
  return `EDWARD-${seg()}-${seg()}-${seg()}`;
}

// Sync tier from stored premium data at startup
const _premiumInit = readPremiumStore();
let _serverTier = _premiumInit.serverTier || 'free';

const log = logger.child({ module: "edward" });

let io: SocketIOServer | null = null;

export function setIo(socketIo: SocketIOServer) {
  io = socketIo;
}

const router: IRouter = Router();

let botConfig: Record<string, any> = {
  botName: 'EDWARD MD', prefix: '.', ownerNumber: '', language: 'en',
  publicMode: true, antiCall: true, antiSpam: true, antiLink: false,
  welcomeMessage: true, goodbyeMessage: true, antiDelete: true,
  antiViewOnce: true, autoReact: false, statusSeen: true, statusReply: false,
  selfMode: false, alwaysOnline: true, autoRead: true, autoTyping: true,
  autoRecording: false, version: '2.0.0',
  // Server & Customization
  serverTier: _serverTier,
  adminEmail: '',
  menuImageUrl: '',
  menuAudioUrl: '',
  menuChannelName: 'EDWARD MD',
  menuNewsletterId: '120363406706906138@newsletter',
  menuType: 'image',
  channelUrl: 'https://whatsapp.com/channel/0029VbCKeh4JP20wrrsjuz0s',
};

router.get('/plugins', (_req, res) => {
  const plugins = getAllPluginsMeta();
  res.json(plugins);
});

router.post('/plugins/toggle', (req, res) => {
  const { id, enabled } = req.body;
  if (!id) { res.status(400).json({ error: 'id required' }); return; }
  setPluginState(id, !!enabled);
  log.info({ id, enabled }, 'Plugin toggled');
  const plugin = getAllPluginsMeta().find((p: any) => p.id === id);
  if (plugin) {
    notifyPluginToggled(plugin.name, plugin.command, !!enabled).catch(() => {});
  }
  res.json({ ok: true, id, enabled });
});

router.post('/plugins/toggleAll', (req, res) => {
  const { category, enabled } = req.body;
  const plugins = getAllPluginsMeta();
  const filtered = category === 'all' ? plugins : plugins.filter(p => p.category === category);
  for (const p of filtered) setPluginState(p.id, !!enabled);
  log.info({ category, enabled, count: filtered.length }, 'Plugins toggle all');
  res.json({ ok: true, count: filtered.length });
});

router.post('/plugins/reload', async (_req, res) => {
  try {
    if (io) io.emit('log', { level: 'info', message: 'Reloading plugins...', source: 'PluginLoader' });
    await downloadAllPlugins((msg) => {
      if (io) io.emit('log', { level: 'info', message: msg, source: 'PluginLoader' });
    });
    await loadPlugins();
    const allPlugins = getAllPluginsMeta();
    if (io) io.emit('log', { level: 'success', message: 'Plugins reloaded', source: 'PluginLoader' });
    notifyPluginsReloaded(allPlugins.length, allPlugins.filter((p: any) => p.enabled !== false).length).catch(() => {});
    res.json({ ok: true, plugins: allPlugins.length });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/config', (_req, res) => {
  res.json(botConfig);
});

router.post('/config', (req, res) => {
  Object.assign(botConfig, req.body);
  try {
    const wa = getWhatsAppManager();
    wa.updateConfig(botConfig);
  } catch {}
  log.info({ update: req.body }, 'Config updated');
  notifySettingsUpdated(req.body).catch(() => {});
  res.json({ ok: true });
});

router.get('/status', async (_req, res) => {
  try {
    const wa = getWhatsAppManager();
    const status = wa.getStatus();
    // Augment with real DB user count so dashboard shows correct numbers even when disconnected
    if (isDbConnected()) {
      const dbUsers = await getUserCount().catch(() => 0);
      if (dbUsers > (status.activeUsers || 0)) {
        (status as any).activeUsers = dbUsers;
      }
    }
    res.json({ ok: true, ...status });
  } catch {
    res.json({ ok: true, connected: false });
  }
});

router.post('/connect/qr', async (_req, res) => {
  try {
    const wa = getWhatsAppManager(io!);
    wa.updateConfig(botConfig);
    // Always clear stale session before a fresh QR connection
    wa.clearSession();
    wa.connect().catch((err: any) => {
      log.error({ err: err.message }, 'Connect error');
      if (io) io.emit('log', { level: 'error', message: `Connection error: ${err.message}`, source: 'Baileys' });
    });
    res.json({ ok: true, message: 'QR generation started. Check the pairing screen for the QR code.' });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/connect/code', async (req, res) => {
  const { phone } = req.body;
  if (!phone) { res.status(400).json({ error: 'Phone number required' }); return; }
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  if (cleanPhone.length < 7) { res.status(400).json({ error: 'Invalid phone number' }); return; }
  try {
    const wa = getWhatsAppManager(io!);
    wa.updateConfig(botConfig);
    // Always clear stale session before a fresh pairing code connection
    wa.clearSession();
    wa.connect(cleanPhone).catch((err: any) => {
      log.error({ err: err.message }, 'Connect error');
      if (io) io.emit('log', { level: 'error', message: `Connection error: ${err.message}`, source: 'Baileys' });
    });
    res.json({ ok: true, message: 'Pairing code requested. Check the pairing screen in about 3 seconds.' });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/reset', async (_req, res) => {
  try {
    const wa = getWhatsAppManager(io!);
    await wa.disconnect().catch(() => {});
    wa.clearSession();
    if (io) io.emit('sessionCleared');
    if (io) io.emit('log', { level: 'info', message: 'Session reset — ready for new connection', source: 'System' });
    res.json({ ok: true, message: 'Session cleared' });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/disconnect', async (_req, res) => {
  try {
    const wa = getWhatsAppManager();
    await wa.disconnect();
    res.json({ ok: true, message: 'Disconnected' });
  } catch {
    res.json({ ok: true, message: 'Not connected' });
  }
});

router.post('/logout', async (_req, res) => {
  try {
    const wa = getWhatsAppManager();
    await wa.logout();
    res.json({ ok: true, message: 'Logged out and session cleared' });
  } catch {
    res.json({ ok: true, message: 'Session cleared' });
  }
});

router.post('/restart', async (_req, res) => {
  try {
    const wa = getWhatsAppManager();
    wa.restart().catch((err: any) => {
      log.error({ err: err.message }, 'Restart error');
    });
    res.json({ ok: true, message: 'Bot restarting...' });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/plugin-stats', (_req, res) => {
  const stats = getPluginUsageStats();
  res.json(stats);
});

router.get('/metrics', async (_req, res) => {
  const dbUsers = isDbConnected() ? await getUserCount().catch(() => 0) : 0;
  try {
    const wa = getWhatsAppManager();
    const s = wa.getStats();
    const plugins = getAllPluginsMeta();
    // Use DB user count if larger than in-memory (DB survives restarts)
    if (dbUsers > (s.activeUsers || 0)) s.activeUsers = dbUsers;
    res.json({
      ...s,
      totalPlugins: plugins.length,
      enabledPlugins: plugins.filter((p: any) => p.enabled !== false).length,
    });
  } catch {
    const memUsed = process.memoryUsage().rss;
    const memTotal = os.totalmem();
    res.json({
      connected: false,
      messagesReceived: 0,
      messagesSent: 0,
      commandsExecuted: 0,
      activeGroups: 0,
      activeUsers: dbUsers,
      errorsToday: 0,
      uptime: 0,
      startTime: Date.now(),
      memoryUsage: Math.round((memUsed / memTotal) * 1000) / 10,
      cpuUsage: 0,
      memoryUsedMB: Math.round(memUsed / 1024 / 1024),
      memoryTotalMB: Math.round(memTotal / 1024 / 1024),
      history: { messages: [], commands: [], users: [] },
      totalPlugins: 0,
      enabledPlugins: 0,
    });
  }
});

router.post('/execute', async (req, res) => {
  const { id, args = [] } = req.body;
  if (!id) { res.status(400).json({ error: 'Plugin id required' }); return; }
  log.info({ id, args }, 'Plugin execute request (dashboard test)');

  const mockResponses: Record<string, any> = {
    ping: { ok: true, output: { latency: `${Math.floor(Math.random() * 50 + 10)}ms`, message: '🏓 Pong!' } },
    alive: { ok: true, output: { message: '🤖 Bot is alive and running!', uptime: `${Math.floor(process.uptime())}s` } },
    calc: { ok: true, output: { expression: args.join(' '), result: String(Function(`"use strict"; return (${args.join(' ') || '0'})`)()) } },
    joke: { ok: true, output: { text: 'Why do programmers prefer dark mode? Because light attracts bugs! 🐛' } },
    quote: { ok: true, output: { text: '"The only way to do great work is to love what you do." — Steve Jobs' } },
    fact: { ok: true, output: { text: 'Honey never expires. Archaeologists have found 3000-year-old honey in Egyptian tombs that was still good!' } },
    weather: { ok: true, output: { city: args[0] || 'Lagos', temp: '28°C', condition: 'Sunny', humidity: '65%', wind: '12 km/h' } },
    uptime: { ok: true, output: { uptime: `${Math.floor(process.uptime())}s`, message: `Bot uptime: ${Math.floor(process.uptime())}s` } },
  };

  await new Promise(r => setTimeout(r, 200 + Math.random() * 300));
  const resp = mockResponses[id] || { ok: true, output: { message: `Plugin "${id}" test run. Connect to WhatsApp for real execution.`, args } };
  res.json(resp);
});

// ── Premium Key Management ────────────────────────────────────────────────────

router.get('/premium/info', (_req, res) => {
  const store = readPremiumStore();
  botConfig.serverTier = store.serverTier || 'free';
  res.json({
    serverTier: store.serverTier || 'free',
    activeKey: store.activeKey ? `${store.activeKey.slice(0, 13)}...` : null,
    totalKeys: store.keys.length,
    usedKeys: store.keys.filter(k => k.activated).length,
    unusedKeys: store.keys.filter(k => !k.activated).length,
  });
});

router.post('/premium/generate', (req, res) => {
  const { adminEmail } = req.body;
  const configuredAdmin = botConfig.adminEmail || 'gboyegaibk@gmail.com';
  if (!adminEmail || adminEmail.trim().toLowerCase() !== configuredAdmin.toLowerCase()) {
    res.status(403).json({ ok: false, error: 'Unauthorized. Only the admin can generate keys.' });
    return;
  }
  const store = readPremiumStore();
  const key = generatePremiumKey();
  store.keys.push({ key, generated: new Date().toISOString(), activated: false, activatedAt: null });
  writePremiumStore(store);
  log.info({ key }, 'Premium key generated');
  res.json({ ok: true, key });
});

router.post('/premium/activate', (req, res) => {
  const { key } = req.body;
  if (!key) { res.status(400).json({ ok: false, error: 'Key is required' }); return; }

  const store = readPremiumStore();
  const found = store.keys.find(k => k.key === key.trim());
  if (!found) {
    res.status(400).json({ ok: false, error: 'Invalid key. Please check and try again.' });
    return;
  }
  if (found.activated) {
    res.status(400).json({ ok: false, error: 'This key has already been used.' });
    return;
  }

  found.activated = true;
  found.activatedAt = new Date().toISOString();
  store.serverTier = 'premium';
  store.activeKey = key.trim();
  writePremiumStore(store);

  botConfig.serverTier = 'premium';
  try { getWhatsAppManager().updateConfig(botConfig); } catch {}
  if (io) io.emit('log', { level: 'success', message: '🎉 Server upgraded to PREMIUM!', source: 'Premium' });

  log.info({ key }, 'Premium key activated — server upgraded');
  res.json({ ok: true, message: '🎉 Server upgraded to Premium!', serverTier: 'premium' });
});

router.post('/premium/keys', (req, res) => {
  const { adminEmail } = req.body;
  const configuredAdmin = botConfig.adminEmail || 'gboyegaibk@gmail.com';
  if (!adminEmail || adminEmail.trim().toLowerCase() !== configuredAdmin.toLowerCase()) {
    res.status(403).json({ ok: false, error: 'Unauthorized' }); return;
  }
  const store = readPremiumStore();
  res.json({ ok: true, keys: store.keys });
});

// ── File Uploads (base64 JSON) ────────────────────────────────────────────────

router.post('/upload', (req, res) => {
  try {
    const { filename, data, type } = req.body;
    if (!filename || !data) {
      res.status(400).json({ ok: false, error: 'filename and data (base64) required' }); return;
    }
    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
    const buffer = Buffer.from(data, 'base64');
    const filePath = path.join(UPLOADS_DIR, safeFilename);
    writeFileSync(filePath, buffer);
    log.info({ filename: safeFilename, size: buffer.length }, 'File uploaded');
    res.json({ ok: true, url: `/api/uploads/${safeFilename}`, size: buffer.length });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.delete('/upload/:filename', (req, res) => {
  try {
    const { existsSync: fe, unlinkSync } = require('fs');
    const safeFilename = req.params.filename.replace(/\.\./g, '').replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = path.join(UPLOADS_DIR, safeFilename);
    if (fe(filePath)) { unlinkSync(filePath); }
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/uploads/:filename', (req, res) => {
  const safeFilename = req.params.filename.replace(/\.\./g, '');
  const filePath = path.join(UPLOADS_DIR, safeFilename);
  if (!existsSync(filePath)) { res.status(404).json({ error: 'Not found' }); return; }
  res.sendFile(filePath);
});

// ── Admin Authentication & Routes ─────────────────────────────────────────────

router.post('/admin/login', (req, res) => {
  const { email, password } = req.body;
  const configuredEmail = ADMIN_EMAIL;
  const configuredPassword = ADMIN_PASSWORD;

  if (!email || !password) {
    res.status(400).json({ ok: false, error: 'Email and password are required' });
    return;
  }

  const emailMatch = email.trim().toLowerCase() === configuredEmail.toLowerCase();
  const passMatch = password === configuredPassword;

  if (!emailMatch || !passMatch) {
    res.status(401).json({ ok: false, error: 'Invalid email or password' });
    return;
  }

  const token = generateAdminToken(email.trim());
  log.info({ email }, 'Admin logged in');
  res.json({ ok: true, token, email: email.trim() });
});

router.post('/admin/logout', (_req, res) => {
  res.json({ ok: true, message: 'Logged out' });
});

router.get('/admin/stats', requireAdmin, async (_req, res) => {
  try {
    const keys = readPremiumStore().keys;
    const servers = readServerRecords();
    const totalUsers = isDbConnected() ? await getUserCount() : 0;

    res.json({
      ok: true,
      totalServers: servers.length,
      freeServers: servers.filter(s => s.plan === 'free').length,
      premiumServers: servers.filter(s => s.plan === 'premium').length,
      totalUsers,
      totalKeys: keys.length,
      usedKeys: keys.filter(k => k.activated).length,
      unusedKeys: keys.filter(k => !k.activated).length,
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/admin/servers', requireAdmin, (_req, res) => {
  try {
    const servers = readServerRecords();
    res.json({ ok: true, servers });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/admin/servers', requireAdmin, (req, res) => {
  try {
    const { name, ownerNumber, plan, notes, usersCount } = req.body;
    if (!name || !ownerNumber) {
      res.status(400).json({ ok: false, error: 'name and ownerNumber are required' });
      return;
    }
    const servers = readServerRecords();
    const newServer: AdminServerRecord = {
      id: crypto.randomBytes(8).toString('hex'),
      name: name.trim(),
      ownerNumber: ownerNumber.trim(),
      plan: plan === 'premium' ? 'premium' : 'free',
      key: null,
      registeredAt: new Date().toISOString(),
      notes: notes || '',
      usersCount: parseInt(usersCount) || 0,
    };
    servers.push(newServer);
    writeServerRecords(servers);
    log.info({ id: newServer.id }, 'Admin: server record created');
    res.json({ ok: true, server: newServer, servers });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.patch('/admin/servers/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const servers = readServerRecords();
    const idx = servers.findIndex(s => s.id === id);
    if (idx === -1) { res.status(404).json({ ok: false, error: 'Server not found' }); return; }
    const { name, ownerNumber, plan, notes, usersCount } = req.body;
    if (name !== undefined) servers[idx].name = name.trim();
    if (ownerNumber !== undefined) servers[idx].ownerNumber = ownerNumber.trim();
    if (plan !== undefined) servers[idx].plan = plan === 'premium' ? 'premium' : 'free';
    if (notes !== undefined) servers[idx].notes = notes;
    if (usersCount !== undefined) servers[idx].usersCount = parseInt(usersCount) || 0;
    writeServerRecords(servers);
    res.json({ ok: true, server: servers[idx], servers });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.delete('/admin/servers/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const servers = readServerRecords();
    const filtered = servers.filter(s => s.id !== id);
    if (filtered.length === servers.length) { res.status(404).json({ ok: false, error: 'Server not found' }); return; }
    writeServerRecords(filtered);
    log.info({ id }, 'Admin: server record deleted');
    res.json({ ok: true, servers: filtered });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/admin/keys', requireAdmin, (_req, res) => {
  try {
    const store = readPremiumStore();
    res.json({ ok: true, keys: store.keys });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/admin/generate-key', requireAdmin, (req, res) => {
  try {
    const store = readPremiumStore();
    const key = generatePremiumKey();
    store.keys.push({ key, generated: new Date().toISOString(), activated: false, activatedAt: null });
    writePremiumStore(store);
    log.info({ key }, 'Admin: premium key generated');
    res.json({ ok: true, key, keys: store.keys });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── Server Capacity ───────────────────────────────────────────────────────────

router.get('/servers', async (_req, res) => {
  try {
    if (!isDbConnected()) {
      // Return a default in-memory server record when DB is not connected
      const usedMB = Math.round(process.memoryUsage().rss / 1024 / 1024);
      return res.json({
        ok: true,
        dbConnected: false,
        servers: [{
          serverId: 'main',
          name: 'EDWARD MD Main Server',
          tier: _serverTier,
          maxUsers: 500,
          maxStorageMB: 500,
          usedStorageMB: usedMB,
          userCount: 0,
          isActive: true,
        }],
      });
    }

    const servers = await getAllServers();
    const result = await Promise.all(servers.map(async (s) => {
      const userCount = await getUserCount(s.serverId);
      return {
        serverId: s.serverId,
        name: s.name,
        tier: s.tier,
        maxUsers: s.maxUsers,
        maxStorageMB: s.maxStorageMB,
        usedStorageMB: s.usedStorageMB,
        userCount,
        isActive: s.isActive,
        isFull: userCount >= s.maxUsers || s.usedStorageMB >= s.maxStorageMB,
      };
    }));

    // Premium servers first
    result.sort((a, b) => (b.tier === 'premium' ? 1 : 0) - (a.tier === 'premium' ? 1 : 0));

    res.json({ ok: true, dbConnected: true, servers: result });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/servers/:id/stats', async (req, res) => {
  try {
    const serverId = req.params.id;
    if (!isDbConnected()) {
      return res.json({ ok: true, dbConnected: false, serverId, userCount: 0 });
    }
    const [server, userCount] = await Promise.all([
      getServerInfo(serverId),
      getUserCount(serverId),
    ]);
    if (!server) { res.status(404).json({ ok: false, error: 'Server not found' }); return; }
    res.json({
      ok: true,
      dbConnected: true,
      serverId: server.serverId,
      name: server.name,
      tier: server.tier,
      maxUsers: server.maxUsers,
      maxStorageMB: server.maxStorageMB,
      usedStorageMB: server.usedStorageMB,
      userCount,
      spaceFreePercent: Math.round(((server.maxStorageMB - server.usedStorageMB) / server.maxStorageMB) * 100),
      userFreePercent: Math.round(((server.maxUsers - userCount) / server.maxUsers) * 100),
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── Public Servers endpoint (for server selection before pairing) ─────────────
router.get('/servers/public', async (_req, res) => {
  try {
    const adminServers: AdminServerRecord[] = existsSync(SERVERS_FILE) ? JSON.parse(readFileSync(SERVERS_FILE, 'utf-8')) : [];
    const keysData = existsSync(KEYS_FILE) ? JSON.parse(readFileSync(KEYS_FILE, 'utf-8')) : { keys: [] };

    const servers = adminServers.map(s => {
      const usedKeys = (keysData.keys || []).filter((k: any) => k.activated).length;
      return {
        id: s.id,
        name: s.name,
        tier: s.plan || 'free',
        maxUsers: s.plan === 'premium' ? 2000 : 500,
        maxStorageMB: s.plan === 'premium' ? 2048 : 500,
        usedStorageMB: Math.round(Math.random() * (s.plan === 'premium' ? 400 : 120)),
        userCount: s.usersCount || 0,
        region: 'Africa/Lagos',
        features: s.plan === 'premium'
          ? ['Unlimited commands', 'Priority support', '2000 users', '2GB storage', 'Custom prefix', 'All plugins']
          : ['All bot commands', '500 users', '500MB storage', 'Community support'],
        notes: s.notes || '',
        registeredAt: s.registeredAt,
      };
    });

    // Always include the main server
    const mainServer = {
      id: 'main',
      name: 'EDWARD MD Main Server',
      tier: 'free',
      maxUsers: 500,
      maxStorageMB: 500,
      usedStorageMB: 0,
      userCount: isDbConnected() ? await getUserCount() : 0,
      region: 'Africa/Lagos',
      features: ['All bot commands', '500 users', '500MB storage', 'Community support'],
      notes: 'Default public server',
      registeredAt: new Date().toISOString(),
    };

    const allServers = [mainServer, ...servers.filter(s => s.id !== 'main')];
    res.json({ ok: true, servers: allServers });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── Premium key validation for server selection ───────────────────────────────
router.post('/servers/validate-key', (req, res) => {
  const { key } = req.body;
  if (!key) { res.status(400).json({ ok: false, error: 'Key required' }); return; }
  const keysData = existsSync(KEYS_FILE) ? JSON.parse(readFileSync(KEYS_FILE, 'utf-8')) : { keys: [] };
  const keyRecord = (keysData.keys || []).find((k: any) => k.key === key && !k.activated);
  if (!keyRecord) {
    res.json({ ok: false, error: 'Invalid key or already used' });
    return;
  }
  res.json({ ok: true, message: 'Key is valid — proceed to pairing' });
});

// ── Community Routes ─────────────────────────────────────────────────────────
function isAdminAuthor(authorId: string): boolean {
  return !!ADMIN_EMAIL && authorId === ADMIN_EMAIL;
}

// GET /api/community/posts
router.get('/community/posts', async (req, res) => {
  try {
    if (!isDbConnected()) { res.json({ ok: true, posts: [] }); return; }
    const { category, page = '1', limit = '20' } = req.query as Record<string, string>;
    const filter: Record<string, any> = {};
    if (category && category !== 'all') filter.category = category;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [posts, total] = await Promise.all([
      CommunityPost.find(filter).sort({ isPinned: -1, createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      CommunityPost.countDocuments(filter),
    ]);
    res.json({ ok: true, posts, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/community/posts
router.post('/community/posts', async (req, res) => {
  try {
    if (!isDbConnected()) { res.status(503).json({ ok: false, error: 'Database not connected' }); return; }
    const { title, content, category, authorName, authorId } = req.body;
    if (!title || !content || !authorName || !authorId) {
      res.status(400).json({ ok: false, error: 'title, content, authorName, authorId required' }); return;
    }
    const post = await CommunityPost.create({
      title: title.slice(0, 200),
      content: content.slice(0, 5000),
      category: category || 'general',
      authorName,
      authorId,
      isAdmin: isAdminAuthor(authorId),
      isPinned: false,
      likes: [],
      replies: [],
    });
    res.json({ ok: true, post });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/community/posts/:id
router.get('/community/posts/:id', async (req, res) => {
  try {
    if (!isDbConnected()) { res.status(503).json({ ok: false, error: 'Database not connected' }); return; }
    const post = await CommunityPost.findById(req.params.id).lean();
    if (!post) { res.status(404).json({ ok: false, error: 'Post not found' }); return; }
    res.json({ ok: true, post });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/community/posts/:id/reply
router.post('/community/posts/:id/reply', async (req, res) => {
  try {
    if (!isDbConnected()) { res.status(503).json({ ok: false, error: 'Database not connected' }); return; }
    const { content, authorName, authorId } = req.body;
    if (!content || !authorName || !authorId) {
      res.status(400).json({ ok: false, error: 'content, authorName, authorId required' }); return;
    }
    const reply = {
      id: crypto.randomBytes(8).toString('hex'),
      authorName,
      authorId,
      isAdmin: isAdminAuthor(authorId),
      content: content.slice(0, 2000),
      createdAt: new Date(),
    };
    const post = await CommunityPost.findByIdAndUpdate(
      req.params.id,
      { $push: { replies: reply }, $set: { updatedAt: new Date() } },
      { new: true }
    ).lean();
    if (!post) { res.status(404).json({ ok: false, error: 'Post not found' }); return; }
    res.json({ ok: true, reply });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/community/posts/:id/like
router.post('/community/posts/:id/like', async (req, res) => {
  try {
    if (!isDbConnected()) { res.status(503).json({ ok: false, error: 'Database not connected' }); return; }
    const { authorId } = req.body;
    if (!authorId) { res.status(400).json({ ok: false, error: 'authorId required' }); return; }
    const post = await CommunityPost.findById(req.params.id);
    if (!post) { res.status(404).json({ ok: false, error: 'Post not found' }); return; }
    const liked = post.likes.includes(authorId);
    if (liked) {
      post.likes = post.likes.filter((id: string) => id !== authorId);
    } else {
      post.likes.push(authorId);
    }
    await post.save();
    res.json({ ok: true, likes: post.likes.length, liked: !liked });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// DELETE /api/community/posts/:id
router.delete('/community/posts/:id', requireAdmin, async (req, res) => {
  try {
    if (!isDbConnected()) { res.status(503).json({ ok: false, error: 'Database not connected' }); return; }
    await CommunityPost.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// PATCH /api/community/posts/:id/pin (admin only)
router.patch('/community/posts/:id/pin', requireAdmin, async (req, res) => {
  try {
    if (!isDbConnected()) { res.status(503).json({ ok: false, error: 'Database not connected' }); return; }
    const post = await CommunityPost.findByIdAndUpdate(
      req.params.id,
      [{ $set: { isPinned: { $not: '$isPinned' } } }],
      { new: true }
    ).lean();
    if (!post) { res.status(404).json({ ok: false, error: 'Post not found' }); return; }
    res.json({ ok: true, isPinned: post.isPinned });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
