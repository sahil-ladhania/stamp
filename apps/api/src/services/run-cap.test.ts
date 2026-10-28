/**
 * File: run-cap.test.ts
 * Purpose: Tests the daily live-run cap and its UTC day boundary.
 * Exports: (none)
 * Used by: vitest
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RunCapReachedError } from "../errors/app-error.js";
import { fakeDb } from "../test-support/fake-db.js";

vi.mock("../lib/prisma.js", async () => ({
  prisma: (await import("../test-support/fake-db.js")).fakeDb.prisma,
}));

const { assertUnderRunCap } = await import("./run-cap.js");

const now = new Date("2026-03-05T15:00:00.000Z");

beforeEach(() => {
  fakeDb.reset();
});

describe("assertUnderRunCap", () => {
  it("allows a run while fewer than the cap have started today", async () => {
    fakeDb.addRun({
      slug: "a",
      startedAt: new Date("2026-03-05T01:00:00.000Z"),
    });
    await expect(assertUnderRunCap(2, now)).resolves.toBeUndefined();
  });

  it("throws RunCapReachedError once the cap is reached, whatever the outcomes were", async () => {
    fakeDb.addRun({
      slug: "a",
      status: "FAILED",
      startedAt: new Date("2026-03-05T01:00:00.000Z"),
    });
    fakeDb.addRun({
      slug: "b",
      status: "DONE",
      startedAt: new Date("2026-03-05T09:00:00.000Z"),
    });
    await expect(assertUnderRunCap(2, now)).rejects.toBeInstanceOf(
      RunCapReachedError,
    );
  });

  it("does not count runs from the previous UTC day", async () => {
    fakeDb.addRun({
      slug: "a",
      startedAt: new Date("2026-03-04T23:59:59.999Z"),
    });
    fakeDb.addRun({
      slug: "b",
      startedAt: new Date("2026-03-04T12:00:00.000Z"),
    });
    await expect(assertUnderRunCap(1, now)).resolves.toBeUndefined();
  });

  it("starts counting again at midnight UTC", async () => {
    fakeDb.addRun({
      slug: "a",
      startedAt: new Date("2026-03-05T23:00:00.000Z"),
    });
    const nextMorning = new Date("2026-03-06T08:00:00.000Z");
    await expect(assertUnderRunCap(1, nextMorning)).resolves.toBeUndefined();
  });
});
