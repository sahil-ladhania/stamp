/**
 * File: run-stub-agent.test.ts
 * Purpose: Tests the default stub run: stage events, claims, delays, and saving a born-expired guide.
 * Exports: (none)
 * Used by: vitest
 */
import { RunStreamEventSchema, STAGES } from "@stamp/schema";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AgentEvent } from "../run-agent.js";
import { play, stageEvents } from "../../test-support/stub-play.js";
import { runStubAgent } from "./run-stub-agent.js";

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
const { LIVE_GUIDE_TTL_MS, saveLiveGuide } =
  await import("../../services/guide-save.js");
const sleepMock = vi.mocked(sleep);
const save = vi.mocked(saveLiveGuide);

beforeEach(() => {
  sleepMock.mockReset().mockResolvedValue();
  save.mockReset().mockResolvedValue({ saved: true });
});

describe("default run", () => {
  it("emits started and done for stages 0 to 8, in order, with the real stage names", async () => {
    const { events } = await play("notion");
    const expected = STAGES.flatMap((s) => [
      { type: "stage.started", stage: s.id, name: s.name },
      { type: "stage.done", stage: s.id },
    ]);
    expect(
      stageEvents(events).map(({ type, stage, ...rest }) => ({
        type,
        stage,
        ...("name" in rest ? { name: rest.name } : {}),
      })),
    ).toEqual(expected);
  });

  it("emits queries, pages with tiers, several verified claims and one downgrade", async () => {
    const { events } = await play("notion");
    const count = (type: string) =>
      events.filter((e) => e.type === type).length;
    expect(count("search.query")).toBeGreaterThanOrEqual(3);
    expect(count("page.fetched")).toBeLessThanOrEqual(6);
    expect(count("claim.verified")).toBeGreaterThanOrEqual(3);
    expect(count("claim.downgraded")).toBe(1);
    const tiers = new Set(
      events.flatMap((e) => (e.type === "page.fetched" ? [e.tier] : [])),
    );
    expect(tiers).toEqual(new Set(["official", "third_party", "forum"]));
  });

  it("emits claim events only between stage 5 started and done", async () => {
    const { events } = await play("notion");
    const start = events.findIndex(
      (e) => e.type === "stage.started" && e.stage === 5,
    );
    const end = events.findIndex(
      (e) => e.type === "stage.done" && e.stage === 5,
    );
    events.forEach((e, index) => {
      const isClaim =
        e.type === "claim.verified" || e.type === "claim.downgraded";
      expect(isClaim).toBe(index > start && index < end);
    });
  });

  it("emits events that all satisfy the shared stream schema and carry the run id", async () => {
    const { events } = await play("notion");
    for (const event of events) {
      expect(RunStreamEventSchema.safeParse(event).success).toBe(true);
      expect(event.runId).toBe("run_1");
    }
  });

  it("reports a measured, non-negative duration for each finished stage", async () => {
    const { events } = await play("notion");
    for (const event of events) {
      if (event.type === "stage.done") {
        expect(event.durationMs).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("saves the guide during stage 8, before stage.done, and then reports done", async () => {
    let lastEventAtSave: AgentEvent | undefined;
    const seen: AgentEvent[] = [];
    save.mockImplementation(async () => {
      lastEventAtSave = seen.at(-1);
      return { saved: true };
    });
    const events: AgentEvent[] = [];
    const outcome = await runStubAgent({
      runId: "run_1",
      app: "Notion",
      slug: "notion",
      emit: async (event) => {
        events.push(event);
        seen.push(event);
      },
      signal: new AbortController().signal,
    });
    expect(save).toHaveBeenCalledTimes(1);
    expect(lastEventAtSave).toMatchObject({ type: "stage.started", stage: 8 });
    expect(outcome).toEqual({ ok: true, slug: "notion", status: "done" });
    expect(events.at(-1)).toMatchObject({ type: "stage.done", stage: 8 });
  });

  it("saves a marked live guide under the run's slug that is born expired", async () => {
    await play("google-calendar");
    const [guide, now] = save.mock.calls[0] ?? [];
    expect(guide).toMatchObject({
      slug: "google-calendar",
      mode: "live",
      coverage: "full",
    });
    expect(guide?.verdict.summary.text).toBe(
      "Stub guide: scripted test data, not real research",
    );
    const expiresAt = (now?.getTime() ?? Infinity) + LIVE_GUIDE_TTL_MS;
    expect(expiresAt).toBeLessThanOrEqual(Date.now());
  });

  it("waits 150 to 400 ms before every event, and the wait ends when the run aborts", async () => {
    const controller = new AbortController();
    const { events } = await play("notion", controller.signal);
    expect(sleepMock).toHaveBeenCalledTimes(events.length);
    for (const [ms, signal] of sleepMock.mock.calls) {
      expect(ms).toBeGreaterThanOrEqual(150);
      expect(ms).toBeLessThanOrEqual(400);
      expect(Number.isInteger(ms)).toBe(true);
      expect(signal).toBe(controller.signal);
    }
  });

  it("points the run at a library guide that owns the slug instead of overwriting it", async () => {
    save.mockResolvedValue({ saved: false, reason: "library_guide_protected" });
    expect((await play("hubspot")).outcome).toEqual({
      ok: true,
      slug: "hubspot",
      status: "done",
    });
    expect((await play("stub-partial")).outcome).toEqual({
      ok: true,
      slug: "stub-partial",
      status: "done",
    });
  });

  it("lets a failed save fail the run instead of hiding it", async () => {
    save.mockRejectedValue(new Error("db down"));
    await expect(play("notion")).rejects.toThrow("db down");
  });
});
