/**
 * File: config.ts
 * Purpose: Zod-validated environment configuration for the API process.
 * Exports: EnvSchema, loadConfig, getConfig, requireRealAgentConfig, EnvConfig, RealAgentConfig
 * Used by: lib/server.ts, lib/prisma.ts, app.ts, middleware, agent
 */
import { z } from "zod";
import { RUN_BUDGET } from "./agent/budget.js";

// Secrets and model names are only needed by the real agent; an empty value counts as unset.
const OptionalText = z
  .string()
  .optional()
  .transform((value) =>
    value === undefined || value.trim() === "" ? undefined : value,
  );

// A plain object, not a strictObject: real process.env carries unrelated keys (PATH, HOME).
const BaseEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  // Required when AGENT_MODE is "real" (see EnvSchema); the stub agent needs none of them.
  OPENAI_API_KEY: OptionalText,
  OPENAI_MODEL_FAST: OptionalText,
  OPENAI_MODEL_STRONG: OptionalText,
  TAVILY_API_KEY: OptionalText,
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
  NODE_ENV: z.string().optional(),
  // "stub" replays scripted test data; "real" runs the research agent. See EnvSchema for the default.
  AGENT_MODE: z.enum(["stub", "real"]).optional(),
  // Can only lower the 120 s run budget, for example to test the partial-guide path.
  AGENT_RUN_BUDGET_MS: z.coerce
    .number()
    .int()
    .positive()
    .max(RUN_BUDGET.maxDurationMs)
    .default(RUN_BUDGET.maxDurationMs),
  // Parallel extraction calls (one per guide section).
  AGENT_EXTRACT_CONCURRENCY: z.coerce.number().int().min(1).max(8).default(4),
  // "off" skips the outbound authorize-URL probe.
  AGENT_PROBE: z.enum(["on", "off"]).default("on"),
});

const REAL_MODE_KEYS = [
  "OPENAI_API_KEY",
  "OPENAI_MODEL_FAST",
  "OPENAI_MODEL_STRONG",
  "TAVILY_API_KEY",
] as const;

/**
 * AGENT_MODE defaults to "stub" outside production; in production it is required, so a deploy cannot
 * serve stub data by accident. The OpenAI and Tavily settings are required only in "real" mode.
 */
export const EnvSchema = BaseEnvSchema.superRefine((env, ctx) => {
  if (env.AGENT_MODE === "real") {
    for (const key of REAL_MODE_KEYS) {
      if (env[key] === undefined) {
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: `${key} is required when AGENT_MODE is "real"`,
        });
      }
    }
  }
  if (env.NODE_ENV === "production" && env.AGENT_MODE === undefined) {
    ctx.addIssue({
      code: "custom",
      path: ["AGENT_MODE"],
      message:
        'AGENT_MODE is required when NODE_ENV is "production" (set it to "real" or "stub")',
    });
  }
}).transform((env) => ({
  ...env,
  AGENT_MODE: env.AGENT_MODE ?? ("stub" as const),
}));

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

export type RealAgentConfig = Record<(typeof REAL_MODE_KEYS)[number], string>;

/**
 * The OpenAI and Tavily settings as non-optional strings. Boot validation already guarantees them in
 * real mode, so a throw here means a client was built in stub mode: a programming error.
 */
export function requireRealAgentConfig(config: EnvConfig): RealAgentConfig {
  const missing = REAL_MODE_KEYS.filter((key) => config[key] === undefined);
  if (missing.length > 0) {
    throw new Error(`Missing agent settings: ${missing.join(", ")}`);
  }
  return {
    OPENAI_API_KEY: config.OPENAI_API_KEY ?? "",
    OPENAI_MODEL_FAST: config.OPENAI_MODEL_FAST ?? "",
    OPENAI_MODEL_STRONG: config.OPENAI_MODEL_STRONG ?? "",
    TAVILY_API_KEY: config.TAVILY_API_KEY ?? "",
  };
}
