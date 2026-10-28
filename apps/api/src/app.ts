/**
 * File: app.ts
 * Purpose: Builds the Express app (middleware, routers, error handling) without listening.
 * Exports: createApp
 * Used by: lib/server.ts, tests
 */
import express, { type Express } from "express";
import type { EnvConfig } from "./config.js";
import { corsMiddleware } from "./middleware/cors.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFound } from "./middleware/not-found.js";
import { createRateLimit } from "./middleware/rate-limit.js";
import { guidesRouter } from "./routes/guides.js";
import { healthRouter } from "./routes/health.js";
import { runsRouter } from "./routes/runs.js";

const JSON_BODY_LIMIT = "16kb";

/** Creates the API app; tests call this with a fixed config. */
export function createApp(config: EnvConfig): Express {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", config.TRUST_PROXY_HOPS);

  app.use(corsMiddleware(config.WEB_ORIGIN));
  app.use(express.json({ limit: JSON_BODY_LIMIT }));

  // Guardrails on the two endpoints that write or cost money; CORS runs first so a 429 is readable.
  app.post("/api/runs", createRateLimit(config, "runs"));
  app.post("/api/guides/:slug/reports", createRateLimit(config, "reports"));

  app.use("/api/health", healthRouter);
  app.use("/api/runs", runsRouter);
  app.use("/api/guides", guidesRouter);
  app.use(notFound);

  app.use(errorHandler);
  return app;
}
