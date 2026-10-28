/**
 * File: run-real-agent-summary.test.ts
 * Purpose: Tests the per-run log line: duration, pages, tokens, Tavily calls and label counts, and that it carries no claim or page text.
 * Exports: (none)
 * Used by: vitest
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from "../lib/logger.js";
import {
  recordModelCall,
  recordPages,
  recordTavilyCall,
} from "../lib/usage.js";
import { assembleGuide } from "./guide/assemble.js";
import { assembleInput } from "../test-support/assemble-helpers.js";
import { getDeps } from "./deps.js";
import { stageNode } from "./stage-node.js";
import type { RunAgentInput } from "./run-agent.js";

const config = vi.hoisted(() => ({
  AGENT_RUN_BUDGET_MS: 120_000,
  AGENT_EXTRACT_CONCURRENCY: 5,
  AGENT_PROBE: "on",
}));
vi.mock("../config.js", () => ({ getConfig: () => config }));
vi.mock("./nodes/index.js", async () => ({
  defaultNodes: (await import("../test-support/graph-harness.js")).NOOP_NODES,
}));
const { runRealAgent } = await import("./run-real-agent.js");

const info = vi.spyOn(logger, "info");
const error = vi.spyOn(logger, "error");
beforeEach(() => {
  info.mockReset().mockImplementation(() => {});
  error.mockReset().mockImplementation(() => {});
});

const guide = assembleGuide(assembleInput());
const input = (): RunAgentInput => ({
  runId: "run_7",
  app: "Acme",
  slug: "acme",
  emit: () => Promise.resolve(),
  signal: new AbortController().signal,
});
const summary = () =>
  info.mock.calls.find(([message]) => message === "run summary")?.[1] as Record<
    string,
    unknown
  >;

/** A save stage that spends tokens, calls and pages through the run's own meter, then returns the guide. */
const spending = stageNode("save", (_state, runnable) => {
  const { usage } = getDeps(runnable);
  recordModelCall(usage, "fast", {
    inputTokens: 100,
    outputTokens: 20,
    totalTokens: 120,
  });
  recordModelCall(usage, "strong", {
    inputTokens: 5_000,
    outputTokens: 800,
    totalTokens: 5_800,
  });
  recordTavilyCall(usage, "search", 1);
  recordTavilyCall(usage, "extract", 2);
  recordPages(usage, { fetched: 4, cacheHits: 2 });
  return Promise.resolve({ guide });
});

describe("the run summary line", () => {
  it("logs the outcome, duration, tokens, Tavily calls and pages", async () => {
    await runRealAgent(input(), {
      nodes: { save: spending },
      now: (() => {
        let t = 1_000;
        return () => (t += 500);
      })(),
    });
    expect(summary()).toMatchObject({
      runId: "run_7",
      ok: true,
      status: "done",
      aborted: false,
      stageReached: 8,
      fastCalls: 1,
      strongCalls: 1,
      totalTokens: 5_920,
      tavilySearchCalls: 1,
      tavilyExtractCalls: 1,
      tavilyCredits: 3,
      pagesFetched: 4,
      pageCacheHits: 2,
    });
    expect(summary().durationMs).toEqual(expect.any(Number));
  });

  it("logs the label counts of the saved guide, with the total", async () => {
    await runRealAgent(input(), { nodes: { save: spending } });
    const { labels, claims } = summary() as {
      labels: Record<string, number>;
      claims: number;
    };
    expect(claims).toBe(labels.sourced + labels.tested + labels.uncertain);
    expect(labels.sourced).toBeGreaterThan(0);
    expect(labels.uncertain).toBeGreaterThan(0);
  });

  it("logs coverage, retries, the probe outcome and the library flag", async () => {
    await runRealAgent(input(), { nodes: { save: spending } });
    expect(summary()).toMatchObject({
      coverage: "full",
      retried: 0,
      probe: "none",
      libraryProtected: false,
    });
  });

  it("logs the probe outcome when the probe ran", async () => {
    const probed = stageNode("probe", () =>
      Promise.resolve({
        probeResult: {
          url: "https://acme.com/oauth/authorize",
          outcome: "passed" as const,
          status: 400,
          reason: "client_rejected",
        },
      }),
    );
    await runRealAgent(input(), { nodes: { save: spending, probe: probed } });
    expect(summary()).toMatchObject({ probe: "passed" });
  });

  it("logs that the run retried once", async () => {
    const missing = stageNode("verify", () =>
      Promise.resolve({ missingSections: ["steps"] }),
    );
    await runRealAgent(input(), { nodes: { save: spending, verify: missing } });
    expect(summary()).toMatchObject({ retried: 1 });
  });

  it("logs a failed run with its code and no label counts to report", async () => {
    const failing = stageNode("resolve", () =>
      Promise.resolve({
        failure: { stage: 0, code: "AMBIGUOUS_APP" as const, message: "m" },
      }),
    );
    await runRealAgent(input(), { nodes: { resolve: failing } });
    expect(summary()).toMatchObject({
      ok: false,
      code: "AMBIGUOUS_APP",
      claims: 0,
      labels: { sourced: 0, tested: 0, uncertain: 0 },
      coverage: null,
    });
  });

  it("logs a run that threw as INTERNAL without the state fields", async () => {
    const boom = stageNode("plan", () =>
      Promise.reject(new Error("model down")),
    );
    await runRealAgent(input(), { nodes: { plan: boom } });
    expect(summary()).toMatchObject({
      ok: false,
      code: "INTERNAL",
      stageReached: 1,
    });
    expect(summary()).not.toHaveProperty("labels");
  });

  it("carries only numbers, flags and codes: no claim text, quote or page text", async () => {
    await runRealAgent(input(), { nodes: { save: spending } });
    const line = JSON.stringify(summary());
    expect(line).not.toContain(guide.steps[0]?.detail.text);
    expect(line).not.toContain("client secret");
  });
});
