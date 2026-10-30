/**
 * File: test-config.ts
 * Purpose: Fixed EnvConfig for tests; no real keys or hosts.
 * Exports: testConfig
 * Used by: *.test.ts that build the app
 */
import type { EnvConfig } from "../config.js";

export const testConfig: EnvConfig = {
  DATABASE_URL: "mysql://test:test@localhost:3306/stamp_test",
  DB_SSL_CA: undefined,
  OPENAI_API_KEY: "test-openai-key",
  OPENAI_MODEL_FAST: "test-fast",
  OPENAI_MODEL_STRONG: "test-strong",
  TAVILY_API_KEY: "test-tavily-key",
  WEB_ORIGIN: "http://localhost:5173",
  DAILY_RUN_CAP: 10,
  ENABLE_BROWSER_AGENT: false,
  PORT: 3000,
  RATE_LIMIT_MAX: 10,
  RATE_LIMIT_WINDOW_SECONDS: 60,
  TRUST_PROXY_HOPS: 0,
  AGENT_MODE: "stub",
  AGENT_RUN_BUDGET_MS: 120_000,
  AGENT_EXTRACT_CONCURRENCY: 5,
  AGENT_PROBE: "on",
};
