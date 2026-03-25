import { Router, type IRouter } from "express";
import { logger } from "../lib/logger";

const log = logger.child({ module: "edward" });
const router: IRouter = Router();

let botConfig: Record<string, any> = {
  botName: 'EDWARD MD', prefix: '.', publicMode: true, antiCall: true,
  antiSpam: true, antiLink: false, welcomeMessage: true, goodbyeMessage: true,
  antiDelete: true, antiViewOnce: true, autoReact: false, statusSeen: true,
  statusReply: false, selfMode: false, alwaysOnline: true, autoRead: true,
  autoTyping: true, autoRecording: false,
};

let pluginStates: Record<string, boolean> = {};

router.get('/plugins', (_req, res) => {
  res.json([]);
});

router.post('/plugins/toggle', (req, res) => {
  const { id, enabled } = req.body;
  if (!id) { res.status(400).json({ error: 'id required' }); return; }
  pluginStates[id] = enabled;
  log.info({ id, enabled }, 'Plugin toggled');
  res.json({ ok: true, id, enabled });
});

router.post('/plugins/toggleAll', (req, res) => {
  const { category, enabled } = req.body;
  log.info({ category, enabled }, 'Plugins toggle all');
  res.json({ ok: true });
});

router.get('/config', (_req, res) => {
  res.json(botConfig);
});

router.post('/config', (req, res) => {
  Object.assign(botConfig, req.body);
  log.info({ update: req.body }, 'Config updated');
  res.json({ ok: true });
});

router.post('/execute', async (req, res) => {
  const { id, args = [] } = req.body;
  if (!id) { res.status(400).json({ error: 'Plugin id required' }); return; }
  log.info({ id, args }, 'Plugin execute request');
  // Simulate plugin execution
  await new Promise(r => setTimeout(r, 300 + Math.random() * 700));
  const mockResponses: Record<string, any> = {
    joke: { ok: true, output: { text: 'Why do programmers prefer dark mode? Because light attracts bugs! 🐛' } },
    quote: { ok: true, output: { text: '"The only way to do great work is to love what you do." - Steve Jobs', author: 'Steve Jobs' } },
    fact: { ok: true, output: { text: 'Honey never expires. Archaeologists have found 3000-year-old honey in Egyptian tombs that was still good to eat!' } },
    weather: { ok: true, output: { city: args[0] || 'Lagos', temp: '28°C', condition: 'Sunny', humidity: '65%', wind: '12 km/h' } },
    ping: { ok: true, output: { latency: `${Math.floor(Math.random() * 50 + 10)}ms` } },
    calc: { ok: true, output: { expression: args.join(' '), result: eval(args.join(' ') || '0') } },
  };
  const resp = mockResponses[id] || { ok: true, output: { message: `Plugin "${id}" executed with args: ${JSON.stringify(args)}`, timestamp: new Date().toISOString() } };
  res.json(resp);
});

router.post('/connect/qr', (_req, res) => {
  // In production this would trigger Baileys to generate a QR
  res.json({ ok: true, message: 'QR generation started. Connect via Socket.IO for the QR data.' });
});

router.post('/connect/code', (req, res) => {
  const { phone } = req.body;
  if (!phone) { res.status(400).json({ error: 'Phone number required' }); return; }
  // In production this would trigger Baileys pairing code flow
  const mockCode = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join('');
  res.json({ ok: true, code: mockCode, message: 'Enter this code in WhatsApp > Linked Devices' });
});

router.post('/disconnect', (_req, res) => {
  res.json({ ok: true, message: 'Disconnected' });
});

export default router;
