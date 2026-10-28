/**
 * File: config.ts
 * Purpose: Zod-validated environment configuration for the API process.
 * Exports: EnvSchema, loadConfig, getConfig, EnvConfig
 * Used by: lib/server.ts, lib/prisma.ts, app.ts, middleware, agent
 */
import { z } from "zod";

// A plain object, not a strictObject: real process.env carries unrelated keys (PATH, HOME).
export const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_MODEL_FAST: z.string().min(1),
  OPENAI_MODEL_STRONG: z.string().min(1),
  TAVILY_API_KEY: z.string().min(1),
  WEB_ORIGIN: z.string().url(),
  DAILY_RUN_CAP: z.coerce.number().int().positive(),
  ENABLE_BROWSER_AGENT: z
    .enum(["true", "false"])
    .transform((value) => value === "true"),
  PORT: z.coerce.number().int().positive().default(3000),
  // Per-IP limit on POST /api/runs and POST /api/guides/:slug/reports (set by env, not code).
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
  RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().positive().default(60),
  // Reverse proxies in front of the API (Railway: 1), so req.ip is the real client.
  TRUST_PROXY_HOPS: z.coerce.number().int().nonnegative().default(0),
});

export type EnvConfig = z.infer<typeof EnvSchema>;

/** Parses env at startup; pass a plain object in tests. */
export function loadConfig(
  source: Record<string, string | undefined> = process.env,
): EnvConfig {
  return EnvSchema.parse(source);
}

let cached: EnvConfig | undefined;

/** Parses process env once and reuses the result; throws at first use if a variable is missing. */
export function getConfig(): EnvConfig {
  cached ??= loadConfig();
  return cached;
}
