import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import app from "./app";
import { logger } from "./lib/logger";
import { getWhatsAppManager } from "./lib/whatsapp";
import { setIo } from "./routes/edward";
import { downloadAllPlugins, loadPlugins } from "./lib/plugins";
import { startKeepAlive } from "./lib/keepalive";
import { connectDatabase, getUserCount, getServerInfo, isConnected as isDbConnected } from "./lib/database";

/** Wait up to `maxMs` for MongoDB to connect, then continue regardless */
async function waitForDb(maxMs = 15_000): Promise<void> {
  const start = Date.now();
  while (!isDbConnected() && Date.now() - start < maxMs) {
    await new Promise(r => setTimeout(r, 500));
  }
}

// ── Crash guards — log and continue instead of dying ──────────────────────────
process.on('uncaughtException', (err) => {
  logger.error({ err: err.message, stack: err.stack }, 'Uncaught exception — keeping process alive');
});
process.on('unhandledRejection', (reason: any) => {
  logger.error({ reason: reason?.message ?? String(reason) }, 'Unhandled promise rejection — keeping process alive');
});

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  path: "/socket.io",
});

setIo(io);
getWhatsAppManager(io);

io.on("connection", (socket) => {
  logger.info({ id: socket.id }, "Socket.IO client connected");
  socket.emit("log", { level: "info", message: "Connected to EDWARD MD backend", source: "Socket" });

  try {
    const wa = getWhatsAppManager();
    const status = wa.getStatus();
    socket.emit("log", {
      level: status.connected ? "success" : "info",
      message: status.connected
        ? `Bot connected as ${status.user?.name ?? status.user?.id}`
        : "Bot not connected — go to pairing to connect",
      source: "System",
    });
    if (status.connected) {
      socket.emit("connected", { jid: status.user?.id, name: status.user?.name });
    }
  } catch {}

  socket.on("disconnect", () => {
    logger.info({ id: socket.id }, "Socket.IO client disconnected");
  });
});

startKeepAlive();

// Connect to MongoDB (non-blocking — app runs fine without it)
connectDatabase().then((ok) => {
  if (ok) {
    logger.info('Database ready — users will be persisted across restarts');
    io.emit('log', { level: 'success', message: 'MongoDB connected — user data will persist', source: 'Database' });
    // Expose DB helpers to plugins via global
    (globalThis as any)._dbHelpers = { getUserCount, getServerInfo, isDbConnected };
  } else {
    logger.warn('Running without persistent database — users tracked in memory only');
  }
}).catch(() => {});

httpServer.listen(port, async (err?: Error) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port }, "EDWARD MD API Server listening with Socket.IO");

  try {
    logger.info("Downloading and loading plugins at startup...");
    await downloadAllPlugins((msg) => {
      io.emit("log", { level: "info", message: msg, source: "PluginLoader" });
      logger.info({ msg }, "Plugin download");
    });
    await loadPlugins();
    logger.info("Plugins ready");
    io.emit("log", { level: "success", message: "All plugins loaded and ready", source: "PluginLoader" });
  } catch (err: any) {
    logger.warn({ err: err.message }, "Plugin startup load error (non-fatal)");
  }

  // ── Auto-reconnect: if a saved session exists, connect immediately ────────
  // Wait briefly for MongoDB so we can check the persistent session there.
  await waitForDb(35_000);
  try {
    const wa = getWhatsAppManager();
    if (await wa.hasExistingSession()) {
      logger.info("Existing WhatsApp session found — auto-connecting...");
      io.emit("log", { level: "info", message: "Saved session detected — auto-connecting bot...", source: "System" });
      wa.connect().catch((e: any) => {
        logger.warn({ err: e.message }, "Auto-connect failed (manual connect required)");
      });
    } else {
      logger.info("No saved WhatsApp session — waiting for manual pairing");
    }
  } catch (e: any) {
    logger.warn({ err: e.message }, "Auto-connect check failed");
  }
});
