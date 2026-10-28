/**
 * File: run-real-agent-concurrency.test.ts
 * Purpose: Tests that the extraction concurrency from the config, or the option, reaches the stages through the run's deps.
 * Exports: (none)
 * Used by: vitest
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from "../lib/logger.js";
import { getDeps } from "./deps.js";
import type { RunAgentInput } from "./run-agent.js";
import { stageNode } from "./stage-node.js";

const config = vi.hoisted(() => ({
  AGENT_RUN_BUDGET_MS: 120_000,
  AGENT_EXTRACT_CONCURRENCY: 5,
}));
vi.mock("../config.js", () => ({ getConfig: () => config }));
vi.mock("./nodes/index.js", async () => ({
  defaultNodes: (await import("../test-support/graph-harness.js")).NOOP_NODES,
}));
const { runRealAgent } = await import("./run-real-agent.js");
vi.spyOn(logger, "info").mockImplementation(() => {});

const input: RunAgentInput = {
  runId: "run_3",
  app: "Notion",
  slug: "notion",
  emit: () => Promise.resolve(),
  signal: new AbortController().signal,
};

async function seenByExtract(options: { extractConcurrency?: number }) {
  let seen: number | undefined;
  await runRealAgent(input, {
    ...options,
    nodes: {
      extract: stageNode("extract", (_state, nodeConfig) => {
        seen = getDeps(nodeConfig).extractConcurrency;
        return Promise.resolve({});
      }),
    },
  });
  return seen;
}

beforeEach(() => {
  config.AGENT_EXTRACT_CONCURRENCY = 5;
});

describe("runRealAgent extraction concurrency", () => {
  it("hands the stages AGENT_EXTRACT_CONCURRENCY", async () => {
    config.AGENT_EXTRACT_CONCURRENCY = 3;
    expect(await seenByExtract({})).toBe(3);
  });

  it("lets the extractConcurrency option override the config", async () => {
    config.AGENT_EXTRACT_CONCURRENCY = 3;
    expect(await seenByExtract({ extractConcurrency: 7 })).toBe(7);
  });

  it("defaults to 5", async () => {
    expect(await seenByExtract({})).toBe(5);
  });
});
