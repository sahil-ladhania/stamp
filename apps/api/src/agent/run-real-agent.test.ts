/**
 * File: run-real-agent.test.ts
 * Purpose: Tests that runRealAgent turns a graph run into the AgentOutcome contract: done, partial or a failure.
 * Exports: (none)
 * Used by: vitest
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RUN_ERROR_MESSAGES } from "../services/run-messages.js";
import { buildStubGuide } from "./stub/stub-guide.js";
import { trace } from "../test-support/graph-harness.js";
import { stageNode } from "./stage-node.js";
import type { AgentEvent, RunAgentInput } from "./run-agent.js";

const config = vi.hoisted(() => ({ AGENT_RUN_BUDGET_MS: 120_000 }));
vi.mock("../config.js", () => ({ getConfig: () => config }));
const { runRealAgent } = await import("./run-real-agent.js");

const guide = buildStubGuide({
  slug: "notion",
  partial: false,
  asOf: new Date("2026-03-05T10:00:00.000Z"),
});
const saveGuide = stageNode("save", () => Promise.resolve({ guide }));

function makeInput(overrides: Partial<RunAgentInput> = {}) {
  const events: AgentEvent[] = [];
  const input: RunAgentInput = {
    runId: "run_9",
    app: "Notion",
    slug: "notion",
    emit: (event) => {
      events.push(event);
      return Promise.resolve();
    },
    signal: new AbortController().signal,
    ...overrides,
  };
  return { input, events };
}

/** A clock the tests move by hand. */
function fakeClock() {
  const time = { t: 5_000 };
  return { time, now: () => time.t };
}

beforeEach(() => {
  config.AGENT_RUN_BUDGET_MS = 120_000;
});

describe("runRealAgent outcome", () => {
  it("reports done with the run's slug when every stage ran and a guide was saved", async () => {
    const { input } = makeInput();
    expect(await runRealAgent(input, { nodes: { save: saveGuide } })).toEqual({
      ok: true,
      slug: "notion",
      status: "done",
    });
  });

  it("emits the 18 stage events to the run's stream with the run id", async () => {
    const { input, events } = makeInput();
    await runRealAgent(input, { nodes: { save: saveGuide } });
    expect(events).toHaveLength(18);
    expect(trace(events)[0]).toBe("stage.started:0");
    expect(trace(events)[17]).toBe("stage.done:8");
    expect(events.every((event) => event.runId === "run_9")).toBe(true);
  });

  it("fails with INTERNAL at stage 8 when the run ends without a saved guide", async () => {
    const { input } = makeInput();
    expect(await runRealAgent(input)).toEqual({
      ok: false,
      failure: {
        stage: 8,
        code: "INTERNAL",
        message: RUN_ERROR_MESSAGES.INTERNAL,
      },
    });
  });

  it("reports partial when the budget ran out and the run went straight to save", async () => {
    const { input } = makeInput();
    const clock = fakeClock();
    const outcome = await runRealAgent(input, {
      now: clock.now,
      nodes: {
        save: saveGuide,
        fetch: stageNode("fetch", () => {
          clock.time.t += 110_000;
          return Promise.resolve({});
        }),
      },
    });
    expect(outcome).toEqual({ ok: true, slug: "notion", status: "partial" });
  });

  it("reports partial when a node flagged the run", async () => {
    const { input } = makeInput();
    const outcome = await runRealAgent(input, {
      nodes: {
        save: saveGuide,
        extract: stageNode("extract", () => Promise.resolve({ partial: true })),
      },
    });
    expect(outcome).toMatchObject({ ok: true, status: "partial" });
  });

  it("passes a stage failure through unchanged, including the did-you-mean options", async () => {
    const { input, events } = makeInput();
    const failure = {
      stage: 0,
      code: "AMBIGUOUS_APP" as const,
      message: "Which one?",
      options: [
        { name: "Linear", domain: "linear.app" },
        { name: "Linear Foods", domain: "linearfoods.com" },
      ],
    };
    const outcome = await runRealAgent(input, {
      nodes: {
        resolve: stageNode("resolve", () => Promise.resolve({ failure })),
      },
    });
    expect(outcome).toEqual({ ok: false, failure });
    expect(trace(events)).toEqual(["stage.started:0"]);
  });
});

describe("runRealAgent budget", () => {
  const spendTwoSeconds = (clock: ReturnType<typeof fakeClock>) =>
    stageNode("plan", () => {
      clock.time.t += 2_000;
      return Promise.resolve({});
    });

  it("reads the budget from AGENT_RUN_BUDGET_MS", async () => {
    config.AGENT_RUN_BUDGET_MS = 5_000;
    const { input, events } = makeInput();
    const clock = fakeClock();
    await runRealAgent(input, {
      now: clock.now,
      nodes: { plan: spendTwoSeconds(clock) },
    });
    expect(trace(events).slice(-2)).toEqual([
      "stage.started:8",
      "stage.done:8",
    ]);
    expect(trace(events)).not.toContain("stage.started:2");
  });

  it("lets the budgetMs option override the config", async () => {
    config.AGENT_RUN_BUDGET_MS = 5_000;
    const { input, events } = makeInput();
    const clock = fakeClock();
    await runRealAgent(input, {
      now: clock.now,
      budgetMs: 120_000,
      nodes: { plan: spendTwoSeconds(clock) },
    });
    expect(trace(events)).toContain("stage.started:2");
  });
});
