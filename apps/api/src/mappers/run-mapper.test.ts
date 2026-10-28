/**
 * File: run-mapper.test.ts
 * Purpose: Tests Prisma run row to RunSnapshot mapping.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { toRunSnapshot } from "./run-mapper.js";

describe("run-mapper", () => {
  it("maps dates and status to wire format", () => {
    const startedAt = new Date("2026-01-01T12:00:00.000Z");
    const snapshot = toRunSnapshot({
      id: "run_1",
      slug: "notion",
      status: "RUNNING",
      stageReached: 2,
      errorCode: null,
      activeSlug: "notion",
      guideId: null,
      startedAt,
      finishedAt: null,
    });
    expect(snapshot).toMatchObject({
      runId: "run_1",
      slug: "notion",
      status: "running",
      stageReached: 2,
      startedAt: startedAt.toISOString(),
      finishedAt: null,
      errorCode: null,
    });
  });

  it("parses a known error code", () => {
    const snapshot = toRunSnapshot({
      id: "run_2",
      slug: "foo",
      status: "FAILED",
      stageReached: 0,
      errorCode: "NOT_OAUTH",
      activeSlug: null,
      guideId: null,
      startedAt: new Date(),
      finishedAt: new Date(),
    });
    expect(snapshot.errorCode).toBe("NOT_OAUTH");
  });
});
