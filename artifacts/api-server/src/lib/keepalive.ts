import { logger } from './logger';

const log = logger.child({ module: 'KeepAlive' });

// Ping every 4 minutes ±30s jitter so Replit never considers the process idle.
// (Replit suspends free-tier apps after ~5 minutes without incoming traffic.)
const BASE_INTERVAL_MS = 4 * 60 * 1000;
const JITTER_MS = 30_000;

function resolvePublicUrl(): string {
  // 1. Explicit override
  if (process.env['SELF_URL']) return process.env['SELF_URL'].replace(/\/$/, '');

  // 2. Render deployment
  if (process.env['RENDER_EXTERNAL_URL']) return process.env['RENDER_EXTERNAL_URL'].replace(/\/$/, '');

  // 3. Replit dev/deployed domain — the API server artifact is mounted at /api on the proxy
  const replitDomain = process.env['REPLIT_DEV_DOMAIN'] || process.env['REPLIT_DOMAINS'];
  if (replitDomain) {
    return `https://${replitDomain.split(',')[0].trim()}/api`;
  }

  // 4. Fallback to localhost (no external keep-alive, but keeps event loop alive)
  return `http://localhost:${process.env['PORT'] ?? 8080}`;
}

export function startKeepAlive() {
  const baseUrl = resolvePublicUrl();
  const pingUrl = `${baseUrl}/healthz`;
  const startedAt = Date.now();

  log.info({ url: pingUrl, intervalMin: BASE_INTERVAL_MS / 60_000 }, 'KeepAlive started');

  let consecutiveFailures = 0;

  async function ping() {
    try {
      const start = Date.now();
      const res = await fetch(pingUrl, {
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

      // After 3 consecutive failures try localhost as fallback
      if (consecutiveFailures >= 3) {
        try {
          await fetch(`http://localhost:${process.env['PORT'] ?? 8080}/healthz`, {
            signal: AbortSignal.timeout(5_000),
          });
          log.info('KeepAlive localhost fallback OK');
        } catch {}
      }
    }

    // Schedule next ping with jitter
    scheduleNext();
  }

  function scheduleNext() {
    const jitter = Math.floor(Math.random() * JITTER_MS * 2) - JITTER_MS;
    const delay = Math.max(BASE_INTERVAL_MS + jitter, 60_000);
    const t = setTimeout(ping, delay);
    if (t.unref) t.unref();
  }

  // First ping after 30 seconds (server fully up)
  const warmup = setTimeout(ping, 30_000);
  if (warmup.unref) warmup.unref();
}
