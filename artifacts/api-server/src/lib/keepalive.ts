import { logger } from './logger';

const log = logger.child({ module: 'KeepAlive' });

const EXTERNAL_INTERVAL_MS = 2 * 60 * 1000;  // external ping every 2 minutes
const LOCAL_INTERVAL_MS    = 60 * 1000;       // localhost ping every 1 minute (REFERENCED — keeps Node alive)

function resolvePublicUrl(): string {
  if (process.env['SELF_URL']) return process.env['SELF_URL'].replace(/\/$/, '');
  if (process.env['RENDER_EXTERNAL_URL']) return process.env['RENDER_EXTERNAL_URL'].replace(/\/$/, '');

  // Replit dev/deployed domain — api-server artifact is mounted at /api
  const replitDomain = process.env['REPLIT_DEV_DOMAIN'] || process.env['REPLIT_DOMAINS'];
  if (replitDomain) {
    return `https://${replitDomain.split(',')[0].trim()}/api`;
  }

  return `http://localhost:${process.env['PORT'] ?? 8080}/api`;
}

export function startKeepAlive() {
  const baseUrl = resolvePublicUrl();
  const externalUrl = `${baseUrl}/healthz`;
  const localUrl   = `http://localhost:${process.env['PORT'] ?? 8080}/api/healthz`;
  const startedAt  = Date.now();

  log.info({ url: externalUrl, intervalMin: EXTERNAL_INTERVAL_MS / 60_000 }, 'KeepAlive started');

  // ── 1. Referenced localhost interval — this is what keeps Node.js alive ──────
  // setInterval without unref() is a "referenced" handle; Node WILL NOT exit
  // while this is pending, even if WhatsApp disconnects or all sockets close.
  setInterval(async () => {
    try {
      await fetch(localUrl, { signal: AbortSignal.timeout(5_000) });
    } catch {}
  }, LOCAL_INTERVAL_MS);

  // ── 2. External URL ping — tells Replit/deployment proxies there is traffic ──
  let consecutiveFailures = 0;

  async function pingExternal() {
    try {
      const start = Date.now();
      const res = await fetch(externalUrl, {
        signal: AbortSignal.timeout(20_000),
        headers: { 'User-Agent': 'EDWARD-MD-KeepAlive/1.0' },
      });
      const ms = Date.now() - start;
      const uptimeMins = Math.floor((Date.now() - startedAt) / 60_000);

      if (res.ok) {
        consecutiveFailures = 0;
        log.info({ ms, uptimeMins }, 'KeepAlive ping OK');
      } else {
        consecutiveFailures++;
        log.warn({ status: res.status, ms, consecutiveFailures }, 'KeepAlive ping non-200');
      }
    } catch (err: any) {
      consecutiveFailures++;
      log.warn({ err: err.message, consecutiveFailures }, 'KeepAlive ping failed');
    }

    scheduleNextExternal();
  }

  function scheduleNextExternal() {
    const jitter = Math.floor(Math.random() * 30_000) - 15_000;
    const delay  = Math.max(EXTERNAL_INTERVAL_MS + jitter, 60_000);
    const t = setTimeout(pingExternal, delay);
    if (t.unref) t.unref(); // external ping doesn't need to keep Node alive — local one does
  }

  // First external ping after 30 seconds
  const warmup = setTimeout(pingExternal, 30_000);
  if (warmup.unref) warmup.unref();
}
