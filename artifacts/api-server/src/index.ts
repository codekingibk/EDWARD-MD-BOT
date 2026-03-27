import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import app from "./app";
import { logger } from "./lib/logger";
import { getWhatsAppManager } from "./lib/whatsapp";
import { setIo } from "./routes/edward";
import { downloadAllPlugins, loadPlugins } from "./lib/plugins";
import { startKeepAlive } from "./lib/keepalive";

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
});
