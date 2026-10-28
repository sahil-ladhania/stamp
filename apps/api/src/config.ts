/**
 * File: config.ts
 * Purpose: Zod-validated environment configuration for the API process.
 * Exports: EnvSchema, loadConfig, EnvConfig
 * Used by: lib/server.ts, agent, middleware
 */
import { z } from "zod";

export const EnvSchema = z.strictObject({
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
});

export type EnvConfig = z.infer<typeof EnvSchema>;

/** Parses process env at startup; pass a plain object in tests. */
export function loadConfig(
  source: Record<string, string | undefined> = process.env,
): EnvConfig {
  return EnvSchema.parse(source);
}
