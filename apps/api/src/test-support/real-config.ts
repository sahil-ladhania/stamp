/**
 * File: real-config.ts
 * Purpose: A real-mode config with dummy agent settings, for tests that mock getConfig.
 * Exports: realAgentConfig
 * Used by: lib/tavily*.test.ts
 */
export const realAgentConfig = {
  AGENT_MODE: "real",
  OPENAI_API_KEY: "o",
  OPENAI_MODEL_FAST: "f",
  OPENAI_MODEL_STRONG: "s",
  TAVILY_API_KEY: "tvly-secret-key",
};
