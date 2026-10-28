/**
 * File: run-view.test.ts
 * Purpose: Tests loading run snapshots and rebuilding terminal events from the database.
 * Exports: (none)
 * Used by: vitest
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError } from "../errors/app-error.js";
import { fakeDb } from "../test-support/fake-db.js";

vi.mock("../lib/prisma.js", async () => ({
  prisma: (await import("../test-support/fake-db.js")).fakeDb.prisma,
}));

const { loadRunView, terminalEventFor } = await import("./run-view.js");

beforeEach(() => {
  fakeDb.reset();
  vi.spyOn(process.stderr, "write").mockReturnValue(true);
});

describe("loadRunView", () => {
  it("throws NotFoundError for an unknown run", async () => {
    await expect(loadRunView("run_nope")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("returns the snapshot and the saved guide's slug", async () => {
    const guide = fakeDb.addGuide({ slug: "notion", mode: "LIVE" });
    const run = fakeDb.addRun({
      slug: "notion",
      status: "DONE",
      guideId: guide.id,
      stageReached: 8,
      finishedAt: new Date(),
    });
    const view = await loadRunView(run.id);
    expect(view.snapshot).toMatchObject({
      runId: run.id,
      status: "done",
      stageReached: 8,
    });
    expect(view.guideSlug).toBe("notion");
  });

  it("fails a run stuck in running past the lock window", async () => {
    const run = fakeDb.addRun({
      slug: "notion",
      activeSlug: "notion",
      startedAt: new Date(Date.now() - 10 * 60_000),
    });
    const view = await loadRunView(run.id);
    expect(view.snapshot).toMatchObject({
      status: "failed",
      errorCode: "INTERNAL",
    });
    expect(fakeDb.runs.get(run.id)?.activeSlug).toBeNull();
  });
});

describe("terminalEventFor", () => {
  async function view(overrides: Parameters<typeof fakeDb.addRun>[0]) {
    return loadRunView(fakeDb.addRun(overrides).id);
  }

  it("is null while the run is still running", async () => {
    expect(terminalEventFor(await view({ slug: "notion" }))).toBeNull();
  });

  it("builds run.done with the saved guide's slug, falling back to the run slug", async () => {
    const guide = fakeDb.addGuide({ slug: "notion-resolved", mode: "LIVE" });
    const withGuide = await view({
      slug: "notion",
      status: "PARTIAL",
      guideId: guide.id,
    });
    expect(terminalEventFor(withGuide)).toMatchObject({
      type: "run.done",
      slug: "notion-resolved",
      status: "partial",
    });
    const without = await view({ slug: "slack", status: "DONE" });
    expect(terminalEventFor(without)).toMatchObject({
      type: "run.done",
      slug: "slack",
      status: "done",
    });
  });

  it("builds run.error from the stored code and stage", async () => {
    const failed = await view({
      slug: "acme",
      status: "FAILED",
      errorCode: "NOT_OAUTH",
      stageReached: 4,
    });
    expect(terminalEventFor(failed)).toMatchObject({
      type: "run.error",
      code: "NOT_OAUTH",
      stage: 4,
    });
  });

  it("defaults to INTERNAL at stage 0 when nothing was recorded", async () => {
    const failed = await view({ slug: "acme", status: "FAILED" });
    expect(terminalEventFor(failed)).toMatchObject({
      type: "run.error",
      code: "INTERNAL",
      stage: 0,
    });
  });
});
