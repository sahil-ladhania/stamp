/**
 * File: run-real-agent-errors.test.ts
 * Purpose: Tests that runRealAgent never throws: aborts and node errors become INTERNAL failures, and each run logs one summary.
 * Exports: (none)
 * Used by: vitest
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from "../lib/logger.js";
import { recordModelCall } from "../lib/usage.js";
import { RUN_ERROR_MESSAGES } from "../services/run-messages.js";
import { trace } from "../test-support/graph-harness.js";
import { getDeps } from "./deps.js";
import type { AgentEvent, RunAgentInput } from "./run-agent.js";
import { stageNode } from "./stage-node.js";

vi.mock("../config.js", () => ({
  getConfig: () => ({ AGENT_RUN_BUDGET_MS: 120_000 }),
}));
const { runRealAgent } = await import("./run-real-agent.js");

const info = vi.spyOn(logger, "info");
const error = vi.spyOn(logger, "error");

function makeInput(controller = new AbortController()) {
  const events: AgentEvent[] = [];
  const input: RunAgentInput = {
    runId: "run_7",
    app: "Notion",
    slug: "notion",
    emit: (event) => {
      events.push(event);
      return Promise.resolve();
    },
    signal: controller.signal,
  };
  return { input, events, controller };
}

const internalAt = (stage: number) => ({
  ok: false,
  failure: { stage, code: "INTERNAL", message: RUN_ERROR_MESSAGES.INTERNAL },
});

beforeEach(() => {
  info.mockReset().mockImplementation(() => {});
  error.mockReset().mockImplementation(() => {});
});

describe("runRealAgent abort", () => {
  it("returns an INTERNAL failure at the running stage and runs nothing after it", async () => {
    const { input, events, controller } = makeInput();
    const fetchBody = vi.fn(() => Promise.resolve({}));
    const outcome = await runRealAgent(input, {
      nodes: {
        search: stageNode("search", () => {
          controller.abort();
          return Promise.resolve({});
        }),
        fetch: stageNode("fetch", fetchBody),
      },
    });
    expect(outcome).toEqual(internalAt(2));
    expect(fetchBody).not.toHaveBeenCalled();
    expect(trace(events).at(-1)).toBe("stage.started:2");
  });

  it("returns at once for a run aborted before it began, emitting nothing", async () => {
    const { input, events, controller } = makeInput();
    controller.abort();
    expect(await runRealAgent(input)).toEqual(internalAt(0));
    expect(events).toEqual([]);
  });

  it("does not log an abort as an error", async () => {
    const { input, controller } = makeInput();
    controller.abort();
    await runRealAgent(input);
    expect(error).not.toHaveBeenCalled();
    expect(info).toHaveBeenCalledWith(
      "run summary",
      expect.objectContaining({ aborted: true }),
    );
  });
});

describe("runRealAgent node errors", () => {
  it("turns a thrown node error into an INTERNAL failure at that stage, never a rejection", async () => {
    const { input } = makeInput();
    const outcome = await runRealAgent(input, {
      nodes: {
        extract: stageNode("extract", () =>
          Promise.reject(new Error("model exploded")),
        ),
      },
    });
    expect(outcome).toEqual(internalAt(4));
  });

  it("logs the error name and message with the run id and stage, and nothing else about the error", async () => {
    const { input } = makeInput();
    const err = Object.assign(new Error("model exploded"), {
      cause: { apiKey: "sk-secret" },
    });
    await runRealAgent(input, {
      nodes: { extract: stageNode("extract", () => Promise.reject(err)) },
    });
    expect(error).toHaveBeenCalledWith("agent run failed", {
      runId: "run_7",
      stage: 4,
      detail: "Error: model exploded",
    });
    expect(JSON.stringify(error.mock.calls)).not.toContain("sk-secret");
  });

  it("turns an error thrown outside any stage body into a failure too", async () => {
    const { input } = makeInput();
    const outcome = await runRealAgent(input, {
      nodes: { resolve: () => Promise.reject(new TypeError("bad")) },
    });
    expect(outcome).toEqual(internalAt(0));
  });
});

describe("runRealAgent summary log", () => {
  it("logs one summary per run with the outcome, last stage, duration and usage", async () => {
    const { input } = makeInput();
    let t = 1_000;
    await runRealAgent(input, {
      now: () => t,
      nodes: {
        plan: stageNode("plan", (_state, config) => {
          recordModelCall(getDeps(config).usage, "fast", {
            inputTokens: 10,
            outputTokens: 5,
            totalTokens: 15,
          });
          t += 250;
          return Promise.resolve({});
        }),
      },
    });
    const summaries = info.mock.calls.filter(
      ([message]) => message === "run summary",
    );
    expect(summaries).toHaveLength(1);
    expect(summaries[0]?.[1]).toMatchObject({
      runId: "run_7",
      ok: false,
      code: "INTERNAL",
      aborted: false,
      stageReached: 8,
      durationMs: 250,
      fastCalls: 1,
      fastInputTokens: 10,
      totalTokens: 15,
    });
  });

  it("keeps the app name and page text out of the log", async () => {
    const { input } = makeInput();
    await runRealAgent(input);
    expect(JSON.stringify(info.mock.calls)).not.toContain("Notion");
  });
});
