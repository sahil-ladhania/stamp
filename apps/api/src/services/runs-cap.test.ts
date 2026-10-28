/**
 * File: runs-cap.test.ts
 * Purpose: Tests that the daily cap blocks new runs but never cached guides or joins.
 * Exports: (none)
 * Used by: vitest
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RunCapReachedError } from "../errors/app-error.js";
import { fakeDb } from "../test-support/fake-db.js";

vi.mock("../lib/prisma.js", async () => ({
  prisma: (await import("../test-support/fake-db.js")).fakeDb.prisma,
}));
vi.mock("../config.js", () => ({ getConfig: () => ({ DAILY_RUN_CAP: 2 }) }));
vi.mock("./run-executor.js", () => ({ launchRun: vi.fn() }));

const { launchRun } = await import("./run-executor.js");
const { startRun } = await import("./runs.js");

beforeEach(() => {
  fakeDb.reset();
  vi.mocked(launchRun).mockReset();
});

describe("startRun: daily cap", () => {
  it("refuses a new run once the cap is reached and starts nothing", async () => {
    fakeDb.addRun({ slug: "a", status: "DONE" });
    fakeDb.addRun({ slug: "b", status: "FAILED" });
    await expect(startRun({ app: "Notion" })).rejects.toBeInstanceOf(
      RunCapReachedError,
    );
    expect(launchRun).not.toHaveBeenCalled();
    expect(fakeDb.runs.size).toBe(2);
  });

  it("still serves cached guides at the cap", async () => {
    fakeDb.addRun({ slug: "a", status: "DONE" });
    fakeDb.addRun({ slug: "b", status: "DONE" });
    fakeDb.addGuide({ slug: "hubspot", mode: "LIBRARY" });
    expect((await startRun({ app: "HubSpot" })).status).toBe("cached");
  });

  it("still lets a request join a running run at the cap", async () => {
    const active = fakeDb.addRun({ slug: "notion", activeSlug: "notion" });
    fakeDb.addRun({ slug: "b", status: "DONE" });
    expect(await startRun({ app: "Notion" })).toEqual({
      status: "running",
      runId: active.id,
    });
  });
});
