import { Router, type IRouter } from 'express';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import path from 'path';
import crypto from 'crypto';

const router: IRouter = Router();

const DATA_DIR = path.join(process.cwd(), 'data');
mkdirSync(DATA_DIR, { recursive: true });

const SERVERS_FILE = path.join(DATA_DIR, 'servers.json');
const PREMIUM_KEYS_FILE = path.join(DATA_DIR, 'premium-keys.json');

// ── Admin credentials (hashed) ────────────────────────────────────────────────
const ADMIN_EMAIL = 'gboyegaibk@gmail.com';
const ADMIN_PASSWORD_HASH = crypto.createHash('sha256').update('Oyinlola@007').digest('hex');

// ── In-memory session tokens ───────────────────────────────────────────────────
const activeSessions = new Set<string>();

function hashPassword(pw: string) {
  return crypto.createHash('sha256').update(pw).digest('hex');
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function requireAdminAuth(req: any, res: any, next: any) {
  const token = req.headers['x-admin-token'] as string;
  if (!token || !activeSessions.has(token)) {
    res.status(401).json({ ok: false, error: 'Unauthorized' });
    return;
  }
  next();
}

// ── Server registry helpers ────────────────────────────────────────────────────
interface ServerRecord {
  id: string;
  name: string;
  ownerNumber: string;
  plan: 'free' | 'premium';
  key: string | null;
  registeredAt: string;
  notes: string;
  usersCount: number;
}

function readServers(): ServerRecord[] {
  try {
    if (existsSync(SERVERS_FILE)) return JSON.parse(readFileSync(SERVERS_FILE, 'utf-8'));
  } catch {}
  return [];
}

function writeServers(servers: ServerRecord[]) {
  writeFileSync(SERVERS_FILE, JSON.stringify(servers, null, 2));
}

function readPremiumKeys() {
  try {
    if (existsSync(PREMIUM_KEYS_FILE)) return JSON.parse(readFileSync(PREMIUM_KEYS_FILE, 'utf-8'));
  } catch {}
  return { keys: [], serverTier: 'free', activeKey: null };
}

function writePremiumKeys(data: any) {
  writeFileSync(PREMIUM_KEYS_FILE, JSON.stringify(data, null, 2));
}

function generatePremiumKey() {
  const seg = () => crypto.randomBytes(3).toString('hex').toUpperCase();
  return `EDWARD-${seg()}-${seg()}-${seg()}`;
}

// ── Routes ────────────────────────────────────────────────────────────────────

router.post('/admin/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ ok: false, error: 'Email and password required' });
    return;
  }
  if (email.trim().toLowerCase() !== ADMIN_EMAIL.toLowerCase() ||
      hashPassword(password) !== ADMIN_PASSWORD_HASH) {
    res.status(403).json({ ok: false, error: 'Invalid credentials' });
    return;
  }
  const token = generateToken();
  activeSessions.add(token);
  res.json({ ok: true, token });
});

router.post('/admin/logout', requireAdminAuth, (req, res) => {
  const token = req.headers['x-admin-token'] as string;
  activeSessions.delete(token);
  res.json({ ok: true });
});

router.get('/admin/stats', requireAdminAuth, (_req, res) => {
  const servers = readServers();
  const premiumData = readPremiumKeys();
  const freeCount = servers.filter(s => s.plan === 'free').length;
  const premiumCount = servers.filter(s => s.plan === 'premium').length;
  const totalUsers = servers.reduce((sum, s) => sum + (s.usersCount || 0), 0);
  res.json({
    ok: true,
    stats: {
      totalServers: servers.length,
      freeServers: freeCount,
      premiumServers: premiumCount,
      totalUsers,
      totalKeys: premiumData.keys?.length || 0,
      usedKeys: premiumData.keys?.filter((k: any) => k.activated)?.length || 0,
      unusedKeys: premiumData.keys?.filter((k: any) => !k.activated)?.length || 0,
    }
  });
});

router.get('/admin/servers', requireAdminAuth, (_req, res) => {
  const servers = readServers();
  res.json({ ok: true, servers });
});

router.post('/admin/servers', requireAdminAuth, (req, res) => {
  const { name, ownerNumber, plan, notes, usersCount } = req.body;
  if (!name) { res.status(400).json({ ok: false, error: 'Server name required' }); return; }

  const servers = readServers();
  let key: string | null = null;

  if (plan === 'premium') {
    key = generatePremiumKey();
    const premiumData = readPremiumKeys();
    premiumData.keys.push({
      key, generated: new Date().toISOString(), activated: false, activatedAt: null,
    });
    writePremiumKeys(premiumData);
  }

  const server: ServerRecord = {
    id: crypto.randomBytes(8).toString('hex'),
    name: name.trim(),
    ownerNumber: ownerNumber?.trim() || '',
    plan: plan === 'premium' ? 'premium' : 'free',
    key,
    registeredAt: new Date().toISOString(),
    notes: notes?.trim() || '',
    usersCount: Number(usersCount) || 0,
  };

  servers.push(server);
  writeServers(servers);
  res.json({ ok: true, server });
});

router.patch('/admin/servers/:id', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  const servers = readServers();
  const idx = servers.findIndex(s => s.id === id);
  if (idx === -1) { res.status(404).json({ ok: false, error: 'Server not found' }); return; }
  const { name, ownerNumber, plan, notes, usersCount } = req.body;
  if (name !== undefined) servers[idx].name = name.trim();
  if (ownerNumber !== undefined) servers[idx].ownerNumber = ownerNumber.trim();
  if (plan !== undefined) servers[idx].plan = plan;
  if (notes !== undefined) servers[idx].notes = notes.trim();
  if (usersCount !== undefined) servers[idx].usersCount = Number(usersCount);
  writeServers(servers);
  res.json({ ok: true, server: servers[idx] });
});

router.delete('/admin/servers/:id', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  const servers = readServers();
  const filtered = servers.filter(s => s.id !== id);
  if (filtered.length === servers.length) {
    res.status(404).json({ ok: false, error: 'Server not found' }); return;
  }
  writeServers(filtered);
  res.json({ ok: true });
});

router.post('/admin/generate-key', requireAdminAuth, (req, res) => {
  const key = generatePremiumKey();
  const premiumData = readPremiumKeys();
  premiumData.keys.push({ key, generated: new Date().toISOString(), activated: false, activatedAt: null });
  writePremiumKeys(premiumData);
  res.json({ ok: true, key });
});

router.get('/admin/keys', requireAdminAuth, (_req, res) => {
  const premiumData = readPremiumKeys();
  res.json({ ok: true, keys: premiumData.keys || [] });
});

export default router;
