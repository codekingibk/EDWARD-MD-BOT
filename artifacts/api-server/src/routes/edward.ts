import { Router, type IRouter } from "express";
import type { Server as SocketIOServer } from 'socket.io';
import { logger } from "../lib/logger";
import { getWhatsAppManager } from "../lib/whatsapp";
import { getAllPluginsMeta, setPluginState, downloadAllPlugins, loadPlugins, getPluginUsageStats } from "../lib/plugins";

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
    if (io) io.emit('log', { level: 'success', message: 'Plugins reloaded', source: 'PluginLoader' });
    res.json({ ok: true, plugins: getAllPluginsMeta().length });
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
  res.json({ ok: true });
});

router.get('/status', (_req, res) => {
  try {
    const wa = getWhatsAppManager();
    res.json({ ok: true, ...wa.getStatus() });
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

export default router;
