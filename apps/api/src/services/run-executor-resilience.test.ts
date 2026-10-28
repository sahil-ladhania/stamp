/**
 * File: run-executor-resilience.test.ts
 * Purpose: Tests the detached run under stress: stage tracking, hung agent, database failure, late events.
 * Exports: (none)
 * Used by: vitest
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AgentOutcome } from "../agent/run-agent.js";
import { fakeDb } from "../test-support/fake-db.js";
import { runToEnd } from "../test-support/run-launch.js";

vi.mock("../lib/prisma.js", async () => ({
  prisma: (await import("../test-support/fake-db.js")).fakeDb.prisma,
}));
vi.mock("../agent/run-agent.js", () => ({ runAgent: vi.fn() }));

const { runAgent } = await import("../agent/run-agent.js");
const { getRunChannel } = await import("./run-events.js");
const { launchRun } = await import("./run-executor.js");
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

describe("launchRun under stress", () => {
  it("keeps the run's stage current in the database while it is in flight", async () => {
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    agent.mockImplementation(async ({ emit, runId }) => {
      await emit({
        type: "stage.started",
        runId,
        stage: 3,
        name: "fetch_pages",
      });
      await gate;
      return {
        ok: false,
        failure: { stage: 3, code: "INTERNAL", message: "x" },
      };
    });
    const run = fakeDb.addRun({ slug: "notion", activeSlug: "notion" });
    launchRun({ id: run.id, slug: "notion", app: "Notion" });
    await vi.waitFor(() =>
      expect(fakeDb.runs.get(run.id)?.stageReached).toBe(3),
    );
    expect(fakeDb.runs.get(run.id)?.status).toBe("RUNNING");
    release();
    await vi.waitFor(() => expect(getRunChannel(run.id)?.isDone).toBe(true));
  });

  it("gives up on an agent that hangs past the budget and aborts it", async () => {
    vi.useFakeTimers();
    let signal: AbortSignal | undefined;
    agent.mockImplementation(({ signal: given }) => {
      signal = given;
      return new Promise<AgentOutcome>(() => {});
    });
    const run = fakeDb.addRun({ slug: "notion", activeSlug: "notion" });
    launchRun({ id: run.id, slug: "notion", app: "Notion" });
    await vi.advanceTimersByTimeAsync(134_000);
    expect(fakeDb.runs.get(run.id)?.status).toBe("RUNNING");
    await vi.advanceTimersByTimeAsync(1_500);
    expect(getRunChannel(run.id)?.isDone).toBe(true);
    expect(getRunChannel(run.id)?.events.at(-1)).toMatchObject({
      type: "run.error",
      code: "INTERNAL",
    });
    expect(fakeDb.runs.get(run.id)).toMatchObject({
      status: "FAILED",
      activeSlug: null,
    });
    expect(signal?.aborted).toBe(true);
  });

  it("still ends the stream when the database cannot record the result", async () => {
    agent.mockResolvedValue({
      ok: false,
      failure: { stage: 1, code: "NOT_OAUTH", message: "API keys only." },
    });
    fakeDb.prisma.run.update.mockRejectedValue(new Error("db down"));
    const { events } = await runToEnd();
    expect(events.at(-1)).toMatchObject({
      type: "run.error",
      code: "NOT_OAUTH",
    });
  });

  it("ignores events an abandoned agent emits after the run ended", async () => {
    let lateEmit: (() => Promise<void>) | undefined;
    agent.mockImplementation(async ({ emit, runId }) => {
      lateEmit = () => emit({ type: "search.query", runId, query: "late" });
      throw new Error("stop");
    });
    const { events } = await runToEnd();
    await expect(lateEmit?.()).resolves.toBeUndefined();
    expect(events.map((e) => e.type)).toEqual(["run.error"]);
  });
});
