/**
 * File: script.test.ts
 * Purpose: Tests the scripted event plans: stage coverage, event types, and consistency with the guide.
 * Exports: (none)
 * Used by: vitest
 */
import { RunStreamEventSchema, STAGES } from "@stamp/schema";
import { describe, expect, it } from "vitest";
import { buildPlan, type StubPlan } from "./script.js";
import { listClaims, stubPages } from "./stub-guide.js";

const asOf = new Date("2026-03-05T10:00:00.000Z");
const plan = (slug: string): StubPlan => buildPlan("run_1", slug, asOf);

function guidePlan(slug: string) {
  const built = plan(slug);
  if (built.kind !== "guide") throw new Error("expected a guide plan");
  return built;
}

function eventsOf(built: StubPlan) {
  return built.stages.flatMap((stage) => stage.events);
}

describe("default plan", () => {
  const built = guidePlan("notion");

  it("covers stages 0 to 8 in order", () => {
    expect(built.stages.map((s) => s.stage)).toEqual(STAGES.map((s) => s.id));
    expect(built.status).toBe("done");
  });

  it("emits only the progress events the docs define, all valid", () => {
    const types = new Set(eventsOf(built).map((event) => event.type));
    expect(types).toEqual(
      new Set([
        "search.query",
        "page.fetched",
        "claim.verified",
        "claim.downgraded",
      ]),
    );
    for (const event of eventsOf(built)) {
      expect(RunStreamEventSchema.safeParse(event).success).toBe(true);
    }
  });

  it("puts each event type in its own stage, claims only in verify", () => {
    const stageOf = (type: string) =>
      built.stages
        .filter((s) => s.events.some((e) => e.type === type))
        .map((s) => s.stage);
    expect(stageOf("search.query")).toEqual([2]);
    expect(stageOf("page.fetched")).toEqual([3]);
    expect(stageOf("claim.verified")).toEqual([5]);
    expect(stageOf("claim.downgraded")).toEqual([5]);
  });

  it("fetches at most 6 pages across all three source tiers", () => {
    const pages = eventsOf(built).filter((e) => e.type === "page.fetched");
    expect(pages.length).toBeLessThanOrEqual(6);
    expect(
      new Set(pages.map((p) => (p.type === "page.fetched" ? p.tier : ""))),
    ).toEqual(new Set(["official", "third_party", "forum"]));
  });

  it("verifies every sourced claim and downgrades only uncertain ones", () => {
    const claims = listClaims(built.guide);
    const sourced = claims
      .filter((c) => c.label === "sourced")
      .map((c) => c.id);
    const uncertain = new Set(
      claims.filter((c) => c.label === "uncertain").map((c) => c.id),
    );
    const verified = eventsOf(built).flatMap((e) =>
      e.type === "claim.verified" ? [e.claimId] : [],
    );
    const downgraded = eventsOf(built).flatMap((e) =>
      e.type === "claim.downgraded" ? [e.claimId] : [],
    );
    expect(verified.sort()).toEqual(sourced.sort());
    expect(verified.length).toBeGreaterThan(3);
    expect(downgraded).toHaveLength(1);
    expect(downgraded.every((id) => uncertain.has(id))).toBe(true);
  });

  it("only verifies claim ids and URLs that exist in the guide and were fetched", () => {
    const byId = new Map(listClaims(built.guide).map((c) => [c.id, c]));
    const fetched = new Set(stubPages("notion").map((p) => p.url));
    for (const event of eventsOf(built)) {
      if (event.type !== "claim.verified") continue;
      expect(byId.get(event.claimId)?.sources[0]?.url).toBe(event.url);
      expect(fetched.has(event.url)).toBe(true);
    }
  });
});

describe("stub-partial plan", () => {
  const built = guidePlan("stub-partial");

  it("is a partial guide that downgrades unfinished claims for the time budget", () => {
    expect(built.status).toBe("partial");
    expect(built.guide.coverage).toBe("partial");
    const downgrades = eventsOf(built).flatMap((e) =>
      e.type === "claim.downgraded" ? [e.reason] : [],
    );
    expect(downgrades.length).toBeGreaterThan(1);
    expect(new Set(downgrades)).toEqual(new Set(["time_budget"]));
  });
});

describe("failure plans", () => {
  it("stub-error: stages 0 to 3 finish, stage 4 fails with INTERNAL", () => {
    const built = plan("stub-error");
    if (built.kind !== "failure") throw new Error("expected failure");
    expect(built.stages.map((s) => s.stage)).toEqual([0, 1, 2, 3]);
    expect(built.failing.stage).toBe(4);
    expect(built.failure).toMatchObject({ stage: 4, code: "INTERNAL" });
  });

  it("stub-ambiguous: fails at stage 0 with two candidates", () => {
    const built = plan("stub-ambiguous");
    if (built.kind !== "failure") throw new Error("expected failure");
    expect(built.stages).toEqual([]);
    expect(built.failure).toMatchObject({ stage: 0, code: "AMBIGUOUS_APP" });
    expect(built.failure.options).toHaveLength(2);
    for (const option of built.failure.options ?? []) {
      expect(option.domain).toMatch(/\.example\.com$/);
    }
  });

  it("stub-notoauth: fails at stage 3 after fetching two pages, without options", () => {
    const built = plan("stub-notoauth");
    if (built.kind !== "failure") throw new Error("expected failure");
    expect(built.stages.map((s) => s.stage)).toEqual([0, 1, 2]);
    expect(built.failing.events.map((e) => e.type)).toEqual([
      "page.fetched",
      "page.fetched",
    ]);
    expect(built.failure).toMatchObject({ stage: 3, code: "NOT_OAUTH" });
    expect(built.failure.options).toBeUndefined();
  });

  it("labels every failure message as a stub scenario, without em dashes", () => {
    for (const slug of ["stub-error", "stub-ambiguous", "stub-notoauth"]) {
      const built = plan(slug);
      if (built.kind !== "failure") throw new Error("expected failure");
      expect(built.failure.message.startsWith("Stub scenario:")).toBe(true);
      expect(built.failure.message).not.toMatch(/\u2014/);
    }
  });
});
