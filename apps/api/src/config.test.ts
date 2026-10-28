/**
 * File: config.test.ts
 * Purpose: Valid and invalid env parsing for loadConfig.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { loadConfig } from "./config.js";

const validEnv = {
  DATABASE_URL: "mysql://localhost/stamp",
  OPENAI_API_KEY: "sk-test",
  OPENAI_MODEL_FAST: "gpt-fast",
  OPENAI_MODEL_STRONG: "gpt-strong",
  TAVILY_API_KEY: "tvly-test",
  WEB_ORIGIN: "http://localhost:5173",
  DAILY_RUN_CAP: "10",
  ENABLE_BROWSER_AGENT: "false",
  PORT: "3000",
};

describe("loadConfig", () => {
  it("parses a valid env object", () => {
    const config = loadConfig(validEnv);
    expect(config.DAILY_RUN_CAP).toBe(10);
    expect(config.ENABLE_BROWSER_AGENT).toBe(false);
    expect(config.PORT).toBe(3000);
  });

  it("rejects a missing DATABASE_URL", () => {
    const { DATABASE_URL: _removed, ...rest } = validEnv;
    expect(() => loadConfig(rest)).toThrow();
  });
});
