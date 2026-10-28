/**
 * File: events.test.ts
 * Purpose: One valid parse test per run stream event type.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import {
  ClaimDowngradedEventSchema,
  ClaimVerifiedEventSchema,
  PageFetchedEventSchema,
  RunDoneEventSchema,
  RunErrorEventSchema,
  RunSnapshotEventSchema,
  RunStreamEventSchema,
  SearchQueryEventSchema,
  StageDoneEventSchema,
  StageStartedEventSchema,
} from "./events.js";

const runId = "run_123";

describe("RunStreamEventSchema", () => {
  it("parses run.snapshot", () => {
    const event = {
      type: "run.snapshot" as const,
      runId,
      snapshot: {
        runId,
        slug: "notion",
        status: "running" as const,
        stageReached: 1,
        startedAt: "2026-01-01T00:00:00.000Z",
        finishedAt: null,
      },
    };
    expect(RunSnapshotEventSchema.safeParse(event).success).toBe(true);
    expect(RunStreamEventSchema.safeParse(event).success).toBe(true);
  });

  it("parses stage.started", () => {
    const event = {
      type: "stage.started" as const,
      runId,
      stage: 1,
      name: "plan_searches",
    };
    expect(StageStartedEventSchema.safeParse(event).success).toBe(true);
    expect(RunStreamEventSchema.safeParse(event).success).toBe(true);
  });

  it("parses stage.done", () => {
    const event = {
      type: "stage.done" as const,
      runId,
      stage: 1,
      durationMs: 1200,
    };
    expect(StageDoneEventSchema.safeParse(event).success).toBe(true);
    expect(RunStreamEventSchema.safeParse(event).success).toBe(true);
  });

  it("parses search.query", () => {
    const event = { type: "search.query" as const, runId, query: "hubspot oauth" };
    expect(SearchQueryEventSchema.safeParse(event).success).toBe(true);
    expect(RunStreamEventSchema.safeParse(event).success).toBe(true);
  });

  it("parses page.fetched", () => {
    const event = {
      type: "page.fetched" as const,
      runId,
      url: "https://developers.hubspot.com/docs",
      tier: "official" as const,
    };
    expect(PageFetchedEventSchema.safeParse(event).success).toBe(true);
    expect(RunStreamEventSchema.safeParse(event).success).toBe(true);
  });

  it("parses claim.verified", () => {
    const event = {
      type: "claim.verified" as const,
      runId,
      claimId: "steps.3",
      url: "https://developers.hubspot.com/docs",
    };
    expect(ClaimVerifiedEventSchema.safeParse(event).success).toBe(true);
    expect(RunStreamEventSchema.safeParse(event).success).toBe(true);
  });

  it("parses claim.downgraded", () => {
    const event = {
      type: "claim.downgraded" as const,
      runId,
      claimId: "steps.3",
      reason: "quote_not_found" as const,
    };
    expect(ClaimDowngradedEventSchema.safeParse(event).success).toBe(true);
    expect(RunStreamEventSchema.safeParse(event).success).toBe(true);
  });

  it("parses run.done", () => {
    const event = {
      type: "run.done" as const,
      runId,
      slug: "notion",
      status: "done" as const,
    };
    expect(RunDoneEventSchema.safeParse(event).success).toBe(true);
    expect(RunStreamEventSchema.safeParse(event).success).toBe(true);
  });

  it("parses run.error", () => {
    const event = {
      type: "run.error" as const,
      runId,
      stage: 0,
      code: "AMBIGUOUS_APP" as const,
      message: "Did you mean one of these?",
      options: [{ name: "Notion", domain: "notion.so" }],
    };
    expect(RunErrorEventSchema.safeParse(event).success).toBe(true);
    expect(RunStreamEventSchema.safeParse(event).success).toBe(true);
  });
});
