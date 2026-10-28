/**
 * File: runs.test.ts
 * Purpose: Valid and invalid examples for run API schemas.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import {
  RunSnapshotSchema,
  StartRunInputSchema,
  StartRunResultSchema,
} from "./runs.js";

describe("StartRunInputSchema", () => {
  it("accepts a valid start run body", () => {
    expect(
      StartRunInputSchema.safeParse({ app: "Notion", force: true }).success,
    ).toBe(true);
  });

  it("rejects an app name that is too short", () => {
    expect(StartRunInputSchema.safeParse({ app: "a" }).success).toBe(false);
  });
});

describe("StartRunResultSchema", () => {
  it("accepts a cached response", () => {
    expect(
      StartRunResultSchema.safeParse({ status: "cached", slug: "notion" })
        .success,
    ).toBe(true);
  });

  it("rejects a missing runId on started", () => {
    expect(
      StartRunResultSchema.safeParse({ status: "started" }).success,
    ).toBe(false);
  });
});

describe("RunSnapshotSchema", () => {
  it("accepts a running snapshot", () => {
    expect(
      RunSnapshotSchema.safeParse({
        runId: "run_1",
        slug: "notion",
        status: "running",
        stageReached: 2,
        startedAt: "2026-01-01T00:00:00.000Z",
        finishedAt: null,
      }).success,
    ).toBe(true);
  });

  it("rejects stageReached above 8", () => {
    expect(
      RunSnapshotSchema.safeParse({
        runId: "run_1",
        slug: "notion",
        status: "running",
        stageReached: 9,
        startedAt: "2026-01-01T00:00:00.000Z",
        finishedAt: null,
      }).success,
    ).toBe(false);
  });
});
