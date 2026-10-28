/**
 * File: run-lock.test.ts
 * Purpose: Tests the per-app run lock: acquire, join, stale clearing and release.
 * Exports: (none)
 * Used by: vitest
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeDb } from "../test-support/fake-db.js";

vi.mock("../lib/prisma.js", async () => ({
  prisma: (await import("../test-support/fake-db.js")).fakeDb.prisma,
}));

const {
  RUN_LOCK_STALE_MS,
  acquireRunLock,
  failStaleRun,
  findJoinableRun,
  finishRun,
  isStaleRun,
  recordStageReached,
} = await import("./run-lock.js");

const minutesAgo = (minutes: number): Date =>
  new Date(Date.now() - minutes * 60_000);

beforeEach(() => {
  fakeDb.reset();
  vi.spyOn(process.stderr, "write").mockReturnValue(true);
});

describe("acquireRunLock", () => {
  it("creates a run that holds the lock for the slug", async () => {
    const { run, isNew } = await acquireRunLock("notion");
    expect(isNew).toBe(true);
    expect(run).toMatchObject({
      slug: "notion",
      activeSlug: "notion",
      status: "RUNNING",
    });
  });

  it("lets a second request join the run that holds the lock", async () => {
    const first = await acquireRunLock("notion");
    const second = await acquireRunLock("notion");
    expect(second.isNew).toBe(false);
    expect(second.run.id).toBe(first.run.id);
    expect(fakeDb.runs.size).toBe(1);
  });

  it("locks different apps independently", async () => {
    const notion = await acquireRunLock("notion");
    const slack = await acquireRunLock("slack");
    expect(slack.isNew).toBe(true);
    expect(slack.run.id).not.toBe(notion.run.id);
  });

  it("clears a stale lock and starts a fresh run", async () => {
    const stale = fakeDb.addRun({
      slug: "notion",
      activeSlug: "notion",
      startedAt: minutesAgo(4),
    });
    const { run, isNew } = await acquireRunLock("notion");
    expect(isNew).toBe(true);
    expect(run.id).not.toBe(stale.id);
    expect(fakeDb.runs.get(stale.id)).toMatchObject({
      status: "FAILED",
      errorCode: "INTERNAL",
      activeSlug: null,
    });
  });

  it("takes the lock again after the holder finishes", async () => {
    const first = await acquireRunLock("notion");
    await finishRun(first.run.id, { status: "done", stageReached: 8 });
    const second = await acquireRunLock("notion");
    expect(second.isNew).toBe(true);
  });

  it("rethrows database errors other than a lock conflict", async () => {
    fakeDb.prisma.run.create.mockRejectedValueOnce(new Error("db down"));
    await expect(acquireRunLock("notion")).rejects.toThrow("db down");
  });
});

describe("findJoinableRun", () => {
  it("returns null when nobody is researching the app", async () => {
    expect(await findJoinableRun("notion")).toBeNull();
  });

  it("returns the active run", async () => {
    const active = fakeDb.addRun({ slug: "notion", activeSlug: "notion" });
    expect((await findJoinableRun("notion"))?.id).toBe(active.id);
  });

  it("fails and skips a stale run", async () => {
    const stale = fakeDb.addRun({
      slug: "notion",
      activeSlug: "notion",
      startedAt: minutesAgo(5),
    });
    expect(await findJoinableRun("notion")).toBeNull();
    expect(fakeDb.runs.get(stale.id)?.status).toBe("FAILED");
  });
});

describe("isStaleRun", () => {
  const startedAt = new Date("2026-01-01T12:00:00.000Z");

  it("is false up to the lock window and true just past it", () => {
    const atLimit = new Date(startedAt.getTime() + RUN_LOCK_STALE_MS);
    expect(isStaleRun({ status: "RUNNING", startedAt }, atLimit)).toBe(false);
    expect(
      isStaleRun(
        { status: "RUNNING", startedAt },
        new Date(atLimit.getTime() + 1),
      ),
    ).toBe(true);
  });

  it("is never true for a finished run", () => {
    expect(isStaleRun({ status: "DONE", startedAt: new Date(0) })).toBe(false);
  });
});

describe("failStaleRun", () => {
  it("leaves a run that finished in the meantime alone", async () => {
    const done = fakeDb.addRun({
      slug: "notion",
      status: "DONE",
      startedAt: minutesAgo(10),
    });
    await failStaleRun(done);
    expect(fakeDb.runs.get(done.id)?.status).toBe("DONE");
  });
});

describe("recordStageReached", () => {
  it("updates the run's stage", async () => {
    const run = fakeDb.addRun({ slug: "notion", activeSlug: "notion" });
    await recordStageReached(run.id, 3);
    expect(fakeDb.runs.get(run.id)?.stageReached).toBe(3);
  });

  it("logs instead of throwing when the write fails", async () => {
    fakeDb.prisma.run.update.mockRejectedValueOnce(new Error("db down"));
    await expect(recordStageReached("run_x", 3)).resolves.toBeUndefined();
  });
});
