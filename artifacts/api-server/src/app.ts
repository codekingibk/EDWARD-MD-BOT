import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import path from "path";
import { existsSync } from "fs";
import { fileURLToPath } from "url";

// Resolve relative to the built dist file so static files are found correctly
// regardless of process.cwd() (which varies between dev and Render production).
const __distDir = path.dirname(fileURLToPath(import.meta.url));

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

app.use("/api", router);

// ── Serve built frontend in production ──────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  // __distDir = artifacts/api-server/dist/ → public is one level up
  const staticDir = path.resolve(__distDir, '..', 'public');
  if (existsSync(staticDir)) {
    app.use(express.static(staticDir));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(staticDir, 'index.html'));
    });
  }
}

export default app;
