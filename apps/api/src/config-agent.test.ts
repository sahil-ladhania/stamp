/**
 * File: config-agent.test.ts
 * Purpose: Tests the OpenAI and Tavily settings (required only in real mode) and the agent limit variables.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { EnvSchema, loadConfig, requireRealAgentConfig } from "./config.js";

const baseEnv = {
  DATABASE_URL: "mysql://localhost/stamp",
  WEB_ORIGIN: "http://localhost:5173",
  DAILY_RUN_CAP: "10",
  ENABLE_BROWSER_AGENT: "false",
};
const agentKeys = {
  OPENAI_API_KEY: "sk-secret-value",
  OPENAI_MODEL_FAST: "gpt-4.1-mini",
  OPENAI_MODEL_STRONG: "gpt-4.1",
  TAVILY_API_KEY: "tvly-secret-value",
};

describe("loadConfig agent settings", () => {
  it("needs no OpenAI or Tavily settings in stub mode", () => {
    const config = loadConfig(baseEnv);
    expect(config.AGENT_MODE).toBe("stub");
    expect(config.OPENAI_API_KEY).toBeUndefined();
    expect(config.TAVILY_API_KEY).toBeUndefined();
  });

  it("treats empty or blank values as unset", () => {
    const config = loadConfig({
      ...baseEnv,
      OPENAI_API_KEY: "",
      TAVILY_API_KEY: "   ",
    });
    expect(config.OPENAI_API_KEY).toBeUndefined();
    expect(config.TAVILY_API_KEY).toBeUndefined();
  });

  it("requires all four settings in real mode, naming each missing one", () => {
    const result = EnvSchema.safeParse({ ...baseEnv, AGENT_MODE: "real" });
    expect(result.success).toBe(false);
    if (result.success) return;
    const paths = result.error.issues.map((issue) => issue.path.join("."));
    expect(paths.sort()).toEqual([
      "OPENAI_API_KEY",
      "OPENAI_MODEL_FAST",
      "OPENAI_MODEL_STRONG",
      "TAVILY_API_KEY",
    ]);
    expect(result.error.issues[0]?.message).toContain(
      'when AGENT_MODE is "real"',
    );
  });

  it.each(Object.keys(agentKeys))(
    "fails in real mode when only %s is missing",
    (missing) => {
      const env = {
        ...baseEnv,
        ...agentKeys,
        AGENT_MODE: "real",
        [missing]: undefined,
      };
      expect(() => loadConfig(env)).toThrow(new RegExp(missing));
    },
  );

  it("treats a blank key as missing in real mode", () => {
    expect(() =>
      loadConfig({
        ...baseEnv,
        ...agentKeys,
        AGENT_MODE: "real",
        TAVILY_API_KEY: "  ",
      }),
    ).toThrow(/TAVILY_API_KEY/);
  });

  it("accepts real mode with every setting present", () => {
    const config = loadConfig({ ...baseEnv, ...agentKeys, AGENT_MODE: "real" });
    expect(config.OPENAI_MODEL_FAST).toBe("gpt-4.1-mini");
    expect(config.OPENAI_MODEL_STRONG).toBe("gpt-4.1");
  });

  it("requires the settings in production real mode but not in production stub mode", () => {
    expect(() =>
      loadConfig({ ...baseEnv, NODE_ENV: "production", AGENT_MODE: "real" }),
    ).toThrow();
    expect(() =>
      loadConfig({ ...baseEnv, NODE_ENV: "production", AGENT_MODE: "stub" }),
    ).not.toThrow();
  });

  it("never puts a secret value in an error message", () => {
    let message = "";
    try {
      loadConfig({
        ...baseEnv,
        OPENAI_API_KEY: agentKeys.OPENAI_API_KEY,
        AGENT_MODE: "real",
      });
    } catch (err) {
      message = err instanceof Error ? err.message : String(err);
    }
    expect(message).toContain("TAVILY_API_KEY");
    expect(message).not.toContain("sk-secret-value");
  });
});

describe("loadConfig agent limits", () => {
  it("defaults to the full 120 s budget, 4 parallel extractions and the probe on", () => {
    const config = loadConfig(baseEnv);
    expect(config.AGENT_RUN_BUDGET_MS).toBe(120_000);
    expect(config.AGENT_EXTRACT_CONCURRENCY).toBe(4);
    expect(config.AGENT_PROBE).toBe("on");
  });

  it("lets the budget be lowered but never raised above 120 s", () => {
    expect(
      loadConfig({ ...baseEnv, AGENT_RUN_BUDGET_MS: "30000" })
        .AGENT_RUN_BUDGET_MS,
    ).toBe(30_000);
    expect(
      loadConfig({ ...baseEnv, AGENT_RUN_BUDGET_MS: "120000" })
        .AGENT_RUN_BUDGET_MS,
    ).toBe(120_000);
    for (const bad of ["120001", "0", "-5", "abc"]) {
      expect(() =>
        loadConfig({ ...baseEnv, AGENT_RUN_BUDGET_MS: bad }),
      ).toThrow();
    }
  });

  it("keeps extraction concurrency between 1 and 8", () => {
    expect(
      loadConfig({ ...baseEnv, AGENT_EXTRACT_CONCURRENCY: "1" })
        .AGENT_EXTRACT_CONCURRENCY,
    ).toBe(1);
    expect(
      loadConfig({ ...baseEnv, AGENT_EXTRACT_CONCURRENCY: "8" })
        .AGENT_EXTRACT_CONCURRENCY,
    ).toBe(8);
    for (const bad of ["0", "9", "2.5"]) {
      expect(() =>
        loadConfig({ ...baseEnv, AGENT_EXTRACT_CONCURRENCY: bad }),
      ).toThrow();
    }
  });

  it("accepts on and off for the probe and rejects anything else", () => {
    expect(loadConfig({ ...baseEnv, AGENT_PROBE: "off" }).AGENT_PROBE).toBe(
      "off",
    );
    expect(() => loadConfig({ ...baseEnv, AGENT_PROBE: "maybe" })).toThrow();
  });
});

describe("requireRealAgentConfig", () => {
  it("returns the four settings as strings in real mode", () => {
    const config = loadConfig({ ...baseEnv, ...agentKeys, AGENT_MODE: "real" });
    expect(requireRealAgentConfig(config)).toEqual(agentKeys);
  });

  it("throws, naming the missing settings but no values, when built in stub mode", () => {
    const config = loadConfig({
      ...baseEnv,
      OPENAI_API_KEY: agentKeys.OPENAI_API_KEY,
    });
    expect(() => requireRealAgentConfig(config)).toThrow(
      "Missing agent settings: OPENAI_MODEL_FAST, OPENAI_MODEL_STRONG, TAVILY_API_KEY",
    );
  });
});
