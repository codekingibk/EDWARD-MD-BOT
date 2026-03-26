import { logger } from './logger';

const log = logger.child({ module: 'KeepAlive' });

const INTERVAL_MS = 10 * 60 * 1000; // ping every 10 minutes

export function startKeepAlive() {
  const selfUrl = (
    process.env['RENDER_EXTERNAL_URL'] ||
    process.env['SELF_URL'] ||
    `http://localhost:${process.env['PORT'] ?? 8080}`
  ).replace(/\/$/, '');

  const pingUrl = `${selfUrl}/health`;

  log.info({ url: pingUrl, intervalMin: 10 }, 'KeepAlive started');

  async function ping() {
    try {
      const start = Date.now();
      const res = await fetch(pingUrl, { signal: AbortSignal.timeout(15000) });
      const ms = Date.now() - start;
      if (res.ok) {
        log.info({ ms }, 'KeepAlive ping OK');
      } else {
        log.warn({ status: res.status, ms }, 'KeepAlive ping non-200');
      }
    } catch (err: any) {
      log.warn({ err: err.message }, 'KeepAlive ping failed');
    }
  }

  // First ping after 1 minute so the server is fully up
  setTimeout(ping, 60_000);

  const iv = setInterval(ping, INTERVAL_MS);

  // Allow process to exit cleanly even if interval is running
  if (iv.unref) iv.unref();

  return iv;
}
