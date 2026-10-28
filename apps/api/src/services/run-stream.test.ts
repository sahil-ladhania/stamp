/**
 * File: run-stream.test.ts
 * Purpose: Tests the stream sequence: snapshot, replay, live events, restart fallback and abort.
 * Exports: (none)
 * Used by: vitest
 */
import type { RunStreamEvent } from "@stamp/schema";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError } from "../errors/app-error.js";
import { fakeDb } from "../test-support/fake-db.js";

vi.mock("../lib/prisma.js", async () => ({
  prisma: (await import("../test-support/fake-db.js")).fakeDb.prisma,
}));

const { openRunChannel, publishRunEvent } = await import("./run-events.js");
const { openRunStream } = await import("./run-stream.js");

beforeEach(() => {
  fakeDb.reset();
  vi.spyOn(process.stderr, "write").mockReturnValue(true);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const stage = (runId: string, n: number): RunStreamEvent => ({
  type: "stage.started",
  runId,
  stage: n,
  name: `stage_${n}`,
});
const done = (runId: string): RunStreamEvent => ({
  type: "run.done",
  runId,
  slug: "notion",
  status: "done",
});

async function collect(
  stream: AsyncGenerator<RunStreamEvent>,
): Promise<string[]> {
  const types: string[] = [];
  for await (const event of stream) {
    types.push(event.type);
  }
  return types;
}

describe("openRunStream with a live buffer", () => {
  it("throws NotFoundError for an unknown run on the first read", async () => {
    await expect(openRunStream("run_nope").next()).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("sends the snapshot, replays buffered events, then follows live ones to the end", async () => {
    const run = fakeDb.addRun({ slug: "notion", activeSlug: "notion" });
    openRunChannel(run.id);
    publishRunEvent(run.id, stage(run.id, 0));
    const collected = collect(openRunStream(run.id));
    await Promise.resolve();
    publishRunEvent(run.id, stage(run.id, 1));
    publishRunEvent(run.id, done(run.id));
    expect(await collected).toEqual([
      "run.snapshot",
      "stage.started",
      "stage.started",
      "run.done",
    ]);
  });

  it("replays the full history to a client that connects after the run finished", async () => {
    const run = fakeDb.addRun({ slug: "notion", status: "DONE" });
    openRunChannel(run.id);
    publishRunEvent(run.id, stage(run.id, 0));
    publishRunEvent(run.id, done(run.id));
    expect(await collect(openRunStream(run.id))).toEqual([
      "run.snapshot",
      "stage.started",
      "run.done",
    ]);
  });

  it("serves two clients from the same run at once", async () => {
    const run = fakeDb.addRun({ slug: "notion", activeSlug: "notion" });
    openRunChannel(run.id);
    const a = collect(openRunStream(run.id));
    const b = collect(openRunStream(run.id));
    await Promise.resolve();
    publishRunEvent(run.id, done(run.id));
    expect(await a).toEqual(["run.snapshot", "run.done"]);
    expect(await b).toEqual(["run.snapshot", "run.done"]);
  });

  it("stops waiting when the client disconnects", async () => {
    const run = fakeDb.addRun({ slug: "notion", activeSlug: "notion" });
    const channel = openRunChannel(run.id);
    const controller = new AbortController();
    const collected = collect(openRunStream(run.id, controller.signal));
    await vi.waitFor(() => expect(channel.waiters.size).toBe(1));
    controller.abort();
    expect(await collected).toEqual(["run.snapshot"]);
    expect(channel.waiters.size).toBe(0);
  });
});

describe("openRunStream without a buffer (restart or expiry)", () => {
  it("ends a finished run with a run.done rebuilt from the database", async () => {
    const guide = fakeDb.addGuide({ slug: "notion", mode: "LIVE" });
    const run = fakeDb.addRun({
      slug: "notion",
      status: "DONE",
      guideId: guide.id,
    });
    const events: RunStreamEvent[] = [];
    for await (const event of openRunStream(run.id)) events.push(event);
    expect(events.map((e) => e.type)).toEqual(["run.snapshot", "run.done"]);
    expect(events[1]).toMatchObject({ slug: "notion", status: "done" });
  });

  it("ends a failed run with its stored error code", async () => {
    const run = fakeDb.addRun({
      slug: "acme",
      status: "FAILED",
      errorCode: "NO_PUBLIC_DOCS",
      stageReached: 3,
    });
    const events: RunStreamEvent[] = [];
    for await (const event of openRunStream(run.id)) events.push(event);
    expect(events[1]).toMatchObject({
      type: "run.error",
      code: "NO_PUBLIC_DOCS",
      stage: 3,
    });
  });

  it("polls a run another process is working on until it finishes", async () => {
    vi.useFakeTimers();
    const run = fakeDb.addRun({ slug: "notion", activeSlug: "notion" });
    const collected = collect(openRunStream(run.id));
    await vi.advanceTimersByTimeAsync(2000);
    Object.assign(fakeDb.runs.get(run.id) ?? {}, {
      status: "DONE",
      activeSlug: null,
    });
    await vi.advanceTimersByTimeAsync(2000);
    expect(await collected).toEqual(["run.snapshot", "run.done"]);
  });

  it("fails and reports a run whose process died more than 3 minutes ago", async () => {
    const run = fakeDb.addRun({
      slug: "notion",
      activeSlug: "notion",
      startedAt: new Date(Date.now() - 4 * 60_000),
    });
    const events: RunStreamEvent[] = [];
    for await (const event of openRunStream(run.id)) events.push(event);
    expect(events.map((e) => e.type)).toEqual(["run.snapshot", "run.error"]);
    expect(events[1]).toMatchObject({ code: "INTERNAL" });
  });

  it("stops polling when the client disconnects", async () => {
    vi.useFakeTimers();
    const run = fakeDb.addRun({ slug: "notion", activeSlug: "notion" });
    const controller = new AbortController();
    const collected = collect(openRunStream(run.id, controller.signal));
    await vi.advanceTimersByTimeAsync(2000);
    controller.abort();
    expect(await collected).toEqual(["run.snapshot"]);
    expect(vi.getTimerCount()).toBe(0);
  });
});
