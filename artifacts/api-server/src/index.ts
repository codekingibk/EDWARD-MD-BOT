import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
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

io.on("connection", (socket) => {
  logger.info({ id: socket.id }, "Socket.IO client connected");
  socket.emit("log", { level: "info", message: "Connected to EDWARD MD backend", source: "Socket" });
  socket.on("disconnect", () => {
    logger.info({ id: socket.id }, "Socket.IO client disconnected");
  });
});

setInterval(() => {
  const msgs = [
    { level: "info", message: "Bot heartbeat OK", source: "System" },
    { level: "success", message: "Message processed successfully", source: "WhatsApp" },
    { level: "info", message: "Checking group activity...", source: "GroupManager" },
  ];
  io.emit("log", msgs[Math.floor(Math.random() * msgs.length)]);
}, 8000);

httpServer.listen(port, (err?: Error) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port }, "Server listening with Socket.IO");
});
