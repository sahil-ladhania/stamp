/**
 * File: run-stub-agent-scenarios.test.ts
 * Purpose: Tests the stub scenarios: partial, error, ambiguous, not-OAuth, abort and copy.
 * Exports: (none)
 * Used by: vitest
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { play, stageEvents, typesOf } from "../../test-support/stub-play.js";

// guide-save loads the real prisma client on import; the runner never touches it.
vi.mock("../../lib/prisma.js", () => ({ prisma: {} }));
vi.mock("../../utils/sleep.js", () => ({
  sleep: vi.fn(() => Promise.resolve()),
}));
vi.mock("../../services/guide-save.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../services/guide-save.js")>()),
  saveLiveGuide: vi.fn(),
}));

const { sleep } = await import("../../utils/sleep.js");
const { saveLiveGuide } = await import("../../services/guide-save.js");
const sleepMock = vi.mocked(sleep);
const save = vi.mocked(saveLiveGuide);

beforeEach(() => {
  sleepMock.mockReset().mockResolvedValue();
  save.mockReset().mockResolvedValue({ saved: true });
});

describe("stub-partial", () => {
  it("saves a partial guide and reports a partial run with time-budget downgrades", async () => {
    const { events, outcome } = await play("stub-partial");
    expect(outcome).toEqual({
      ok: true,
      slug: "stub-partial",
      status: "partial",
    });
    expect(save.mock.calls[0]?.[0].coverage).toBe("partial");
    const reasons = events.flatMap((e) =>
      e.type === "claim.downgraded" ? [e.reason] : [],
    );
    expect(reasons.length).toBeGreaterThan(0);
    expect(new Set(reasons)).toEqual(new Set(["time_budget"]));
    expect(stageEvents(events)).toHaveLength(18);
  });
});

describe("failure scenarios", () => {
  it("stub-error: stages 0 to 3 finish, stage 4 starts, then INTERNAL at stage 4", async () => {
    const { events, outcome } = await play("stub-error");
    const stages = stageEvents(events).map((e) => `${e.type}:${e.stage}`);
    expect(stages.slice(0, 8)).toEqual([
      "stage.started:0",
      "stage.done:0",
      "stage.started:1",
      "stage.done:1",
      "stage.started:2",
      "stage.done:2",
      "stage.started:3",
      "stage.done:3",
    ]);
    expect(stages.at(-1)).toBe("stage.started:4");
    expect(stages).not.toContain("stage.done:4");
    expect(outcome).toMatchObject({
      ok: false,
      failure: { stage: 4, code: "INTERNAL" },
    });
    expect(save).not.toHaveBeenCalled();
  });

  it("stub-ambiguous: stage 0 starts, then AMBIGUOUS_APP with 2 options", async () => {
    const { events, outcome } = await play("stub-ambiguous");
    expect(typesOf(events)).toEqual(["stage.started"]);
    expect(outcome).toMatchObject({
      ok: false,
      failure: { stage: 0, code: "AMBIGUOUS_APP" },
    });
    if (outcome.ok) throw new Error("expected failure");
    expect(outcome.failure.options).toHaveLength(2);
    expect(save).not.toHaveBeenCalled();
  });

  it("stub-notoauth: fetches two pages in stage 3, then NOT_OAUTH", async () => {
    const { events, outcome } = await play("stub-notoauth");
    expect(events.filter((e) => e.type === "page.fetched")).toHaveLength(2);
    expect(outcome).toMatchObject({
      ok: false,
      failure: { stage: 3, code: "NOT_OAUTH" },
    });
    if (outcome.ok) throw new Error("expected failure");
    expect(outcome.failure.options).toBeUndefined();
    expect(save).not.toHaveBeenCalled();
  });
});

describe("abort and copy", () => {
  it("stops emitting and saving as soon as the run is aborted", async () => {
    const controller = new AbortController();
    let waits = 0;
    sleepMock.mockImplementation(async () => {
      waits += 1;
      if (waits === 5) controller.abort();
    });
    const { events, outcome } = await play("notion", controller.signal);
    expect(events).toHaveLength(4);
    expect(outcome).toMatchObject({ ok: false, failure: { code: "INTERNAL" } });
    expect(save).not.toHaveBeenCalled();
  });

  it("has no em dashes in any emitted event, outcome or saved guide", async () => {
    const all = [];
    for (const slug of [
      "notion",
      "stub-partial",
      "stub-error",
      "stub-ambiguous",
      "stub-notoauth",
    ]) {
      const { events, outcome } = await play(slug);
      all.push(events, outcome);
    }
    all.push(save.mock.calls.map((call) => call[0]));
    expect(JSON.stringify(all)).not.toMatch(/\u2014/);
  });
});
