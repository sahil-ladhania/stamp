/**
 * File: run-executor.test.ts
 * Purpose: Tests the detached run: events, outcomes, failures, timeout and lock release.
 * Exports: (none)
 * Used by: vitest
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AgentOutcome, RunAgentInput } from "../agent/run-agent.js";
import { fakeDb } from "../test-support/fake-db.js";
import { runToEnd } from "../test-support/run-launch.js";

vi.mock("../lib/prisma.js", async () => ({
  prisma: (await import("../test-support/fake-db.js")).fakeDb.prisma,
}));
vi.mock("../agent/run-agent.js", () => ({ runAgent: vi.fn() }));

const { runAgent } = await import("../agent/run-agent.js");
const agent = vi.mocked(runAgent);

beforeEach(() => {
  fakeDb.reset();
  agent.mockReset();
  vi.spyOn(process.stderr, "write").mockReturnValue(true);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function agentSaving(outcome: Extract<AgentOutcome, { ok: true }>) {
  return async ({ emit, runId }: RunAgentInput): Promise<AgentOutcome> => {
    await emit({ type: "stage.started", runId, stage: 0, name: "resolve_app" });
    await emit({ type: "stage.started", runId, stage: 8, name: "save" });
    fakeDb.addGuide({ slug: outcome.slug, mode: "LIVE" });
    return outcome;
  };
}

describe("launchRun", () => {
  it("publishes agent events, then run.done, and releases the lock", async () => {
    agent.mockImplementation(
      agentSaving({ ok: true, slug: "notion", status: "done" }),
    );
    const { id, events } = await runToEnd();
    expect(events.map((e) => e.type)).toEqual([
      "stage.started",
      "stage.started",
      "run.done",
    ]);
    expect(events.at(-1)).toMatchObject({
      type: "run.done",
      slug: "notion",
      status: "done",
    });
    expect(fakeDb.runs.get(id)).toMatchObject({
      status: "DONE",
      stageReached: 8,
      activeSlug: null,
      guideId: "guide_notion",
    });
    expect(fakeDb.runs.get(id)?.finishedAt).toBeInstanceOf(Date);
  });

  it("records a partial guide as partial", async () => {
    agent.mockImplementation(
      agentSaving({ ok: true, slug: "notion", status: "partial" }),
    );
    const { id, events } = await runToEnd();
    expect(events.at(-1)).toMatchObject({
      type: "run.done",
      status: "partial",
    });
    expect(fakeDb.runs.get(id)?.status).toBe("PARTIAL");
  });

  it("turns an agent failure into run.error with its options and stores the code", async () => {
    const options = [{ name: "Notion", domain: "notion.so" }];
    agent.mockResolvedValue({
      ok: false,
      failure: {
        stage: 0,
        code: "AMBIGUOUS_APP",
        message: "Which one?",
        options,
      },
    });
    const { id, events } = await runToEnd();
    expect(events).toEqual([
      {
        type: "run.error",
        runId: id,
        stage: 0,
        code: "AMBIGUOUS_APP",
        message: "Which one?",
        options,
      },
    ]);
    expect(fakeDb.runs.get(id)).toMatchObject({
      status: "FAILED",
      errorCode: "AMBIGUOUS_APP",
      activeSlug: null,
    });
  });

  it("omits options when the failure has none", async () => {
    agent.mockResolvedValue({
      ok: false,
      failure: { stage: 3, code: "NO_PUBLIC_DOCS", message: "No docs." },
    });
    const { events } = await runToEnd();
    expect(events[0]).not.toHaveProperty("options");
  });

  it("fails the run with INTERNAL when the agent throws", async () => {
    agent.mockImplementation(async ({ emit, runId }) => {
      await emit({ type: "stage.started", runId, stage: 2, name: "search" });
      throw new Error("provider exploded");
    });
    const { id, events } = await runToEnd();
    expect(events.at(-1)).toMatchObject({
      type: "run.error",
      code: "INTERNAL",
      stage: 2,
    });
    expect(JSON.stringify(events)).not.toContain("provider exploded");
    expect(fakeDb.runs.get(id)).toMatchObject({
      status: "FAILED",
      errorCode: "INTERNAL",
      activeSlug: null,
    });
  });

  it("fails a run whose agent reports a guide that was never stored", async () => {
    agent.mockResolvedValue({ ok: true, slug: "ghost", status: "done" });
    const { id, events } = await runToEnd();
    expect(events.at(-1)).toMatchObject({
      type: "run.error",
      code: "INTERNAL",
    });
    expect(fakeDb.runs.get(id)?.status).toBe("FAILED");
  });
});
