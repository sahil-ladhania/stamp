/**
 * File: runs.test.ts
 * Purpose: Tests startRun ordering (cache, join, cap, lock) and run snapshots.
 * Exports: (none)
 * Used by: vitest
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "../../generated/prisma/client.js";
import { NotFoundError, ValidationError } from "../errors/app-error.js";
import { fakeDb } from "../test-support/fake-db.js";

vi.mock("../lib/prisma.js", async () => ({
  prisma: (await import("../test-support/fake-db.js")).fakeDb.prisma,
}));
vi.mock("../config.js", () => ({ getConfig: () => ({ DAILY_RUN_CAP: 2 }) }));
vi.mock("./run-executor.js", () => ({ launchRun: vi.fn() }));

const { launchRun } = await import("./run-executor.js");
const { getRunById, startRun } = await import("./runs.js");

const hoursFromNow = (hours: number): Date =>
  new Date(Date.now() + hours * 3_600_000);

beforeEach(() => {
  fakeDb.reset();
  vi.mocked(launchRun).mockReset();
  vi.spyOn(process.stderr, "write").mockReturnValue(true);
});

describe("startRun: cache", () => {
  it("returns a library guide as cached, even with force", async () => {
    fakeDb.addGuide({ slug: "hubspot", mode: "LIBRARY" });
    expect(await startRun({ app: "HubSpot" })).toEqual({
      status: "cached",
      slug: "hubspot",
    });
    expect(await startRun({ app: "HubSpot", force: true })).toEqual({
      status: "cached",
      slug: "hubspot",
    });
    expect(launchRun).not.toHaveBeenCalled();
  });

  it("returns a fresh live guide as cached", async () => {
    fakeDb.addGuide({
      slug: "notion",
      mode: "LIVE",
      expiresAt: hoursFromNow(24),
    });
    expect(await startRun({ app: "Notion" })).toEqual({
      status: "cached",
      slug: "notion",
    });
  });

  it("starts a run for an expired live guide", async () => {
    fakeDb.addGuide({
      slug: "notion",
      mode: "LIVE",
      expiresAt: hoursFromNow(-1),
    });
    expect((await startRun({ app: "Notion" })).status).toBe("started");
  });

  it("starts a run for a fresh live guide when force is set", async () => {
    fakeDb.addGuide({
      slug: "notion",
      mode: "LIVE",
      expiresAt: hoursFromNow(24),
    });
    expect((await startRun({ app: "Notion", force: true })).status).toBe(
      "started",
    );
  });

  it("matches a URL to the slug of the app it names", async () => {
    fakeDb.addGuide({
      slug: "notion",
      mode: "LIVE",
      expiresAt: hoursFromNow(24),
    });
    expect(await startRun({ app: "https://www.notion.so/product" })).toEqual({
      status: "cached",
      slug: "notion",
    });
  });

  it("rejects input that has no letters or digits", async () => {
    await expect(startRun({ app: "!!" })).rejects.toBeInstanceOf(
      ValidationError,
    );
  });
});

describe("startRun: lock", () => {
  it("creates a locked run, launches it with what the user typed, and says started", async () => {
    const result = await startRun({ app: "Google Calendar" });
    expect(result.status).toBe("started");
    const run = [...fakeDb.runs.values()][0];
    expect(run).toMatchObject({
      slug: "google-calendar",
      activeSlug: "google-calendar",
    });
    expect(launchRun).toHaveBeenCalledWith({
      id: run?.id,
      slug: "google-calendar",
      app: "Google Calendar",
    });
  });

  it("lets a second request for the same app join the first run", async () => {
    const first = await startRun({ app: "Notion" });
    const second = await startRun({ app: "notion" });
    expect(second).toEqual({
      status: "running",
      runId: first.status === "started" ? first.runId : "",
    });
    expect(launchRun).toHaveBeenCalledTimes(1);
    expect(fakeDb.runs.size).toBe(1);
  });

  it("joins the winner when two requests race for the lock", async () => {
    const winner = fakeDb.addRun({ slug: "notion", activeSlug: "notion" });
    fakeDb.prisma.run.findUnique.mockResolvedValueOnce(null);
    expect(await startRun({ app: "Notion" })).toEqual({
      status: "running",
      runId: winner.id,
    });
    expect(launchRun).not.toHaveBeenCalled();
  });

  it("starts a new run when the previous one is stale", async () => {
    const stale = fakeDb.addRun({
      slug: "notion",
      activeSlug: "notion",
      startedAt: new Date(Date.now() - 5 * 60_000),
    });
    const result = await startRun({ app: "Notion" });
    expect(result.status).toBe("started");
    expect(fakeDb.runs.get(stale.id)?.status).toBe("FAILED");
  });

  it("surfaces unexpected database errors", async () => {
    fakeDb.prisma.run.create.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("down", {
        code: "P1001",
        clientVersion: "test",
      }),
    );
    await expect(startRun({ app: "Notion" })).rejects.toThrow("down");
  });
});

describe("getRunById", () => {
  it("returns the snapshot", async () => {
    const run = fakeDb.addRun({
      slug: "notion",
      activeSlug: "notion",
      stageReached: 2,
    });
    expect(await getRunById(run.id)).toMatchObject({
      runId: run.id,
      status: "running",
      stageReached: 2,
    });
  });

  it("throws NotFoundError for an unknown run", async () => {
    await expect(getRunById("run_nope")).rejects.toBeInstanceOf(NotFoundError);
  });
});
