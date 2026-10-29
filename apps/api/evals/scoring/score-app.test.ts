/**
 * File: score-app.test.ts
 * Purpose: Tests scoring one captured run against its golden entry, for a good run, a run with the stored-guide failures, and a failed run.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { loadGolden, type Golden } from "../lib/golden.js";
import { failedCapture, goodCapture } from "../lib/fixtures/run-capture.js";
import { brokenCapture } from "../lib/fixtures/broken-capture.js";
import { describeWait } from "./gate.js";
import { scoreApp } from "./score-app.js";

const all = await loadGolden();
const gmail: Golden = all.find((g) => g.slug === "gmail")!;

describe("scoreApp on a good run", () => {
  const score = scoreApp(goodCapture(), gmail, 0.17);

  it("reports the run's status, time and cost", () => {
    expect(score).toMatchObject({
      slug: "gmail",
      set: "tuning",
      status: "done",
      failureCode: null,
      within120s: true,
      costUsd: 0.17,
    });
    expect(score.tavilyCredits).toBe(11);
    expect(score.tokens).toBe(38_000);
  });

  it("matches the gate and the wait", () => {
    expect(score.gate).toEqual({
      found: "security_assessment",
      verdict: "match",
      tier: "official",
    });
    expect(score.wait).toEqual({ found: "42 days", verdict: "match" });
  });

  it("describes a range wait with both ends", () => {
    expect(describeWait({ minDays: 14, maxDays: 60 })).toBe("14 to 60 days");
  });

  it("finds the real scopes and no fake ones", () => {
    expect(score.scopes.real).toHaveLength(2);
    expect(score.scopes.fake).toEqual([]);
  });

  it("finds all four milestone fields to be durations", () => {
    expect(score.durations).toEqual({ total: 4, ok: 4, unknown: 0, prose: [] });
  });

  it("passes the top blocker and has no contradictions or wrong-product sources", () => {
    expect(score.topBlocker.verdict).toBe("pass");
    expect(score.contradictions).toEqual([]);
    expect(score.sources.wrongProduct).toEqual([]);
  });

  it("answers all five key fields and counts labels", () => {
    expect(score.coverage.missing).toEqual([]);
    expect(score.labels.claims).toBeGreaterThan(0);
    expect(score.labels.uncertainShare).toBeGreaterThan(0);
    expect(score.labels.uncertainShare).toBeLessThan(1);
  });
});

describe("scoreApp on a run with the stored-guide failures", () => {
  const score = scoreApp(brokenCapture(), gmail, null);

  it("counts the wrong-product page in the cited sources and in the pages held", () => {
    expect(score.sources.wrongProduct).toHaveLength(1);
    expect(score.sources.heldWrongProduct).toHaveLength(1);
  });

  it("flags the description as a fake scope and keeps the real one", () => {
    expect(score.scopes.fake).toEqual(["Read open message metadata"]);
    expect(score.scopes.real).toEqual(["gmail.readonly"]);
  });

  it("names the milestone fields that hold prose", () => {
    expect(score.durations.prose).toEqual([
      "milestones.firstTest.effort",
      "milestones.production.wait",
    ]);
    expect(score.durations.unknown).toBe(1);
    expect(score.durations.ok).toBe(1);
  });

  it("marks the wrong gate and fails the third-party top blocker", () => {
    expect(score.gate.verdict).toBe("wrong");
    expect(score.topBlocker.verdict).toBe("fail");
  });

  it("lists the confident wrong answers as contradictions", () => {
    expect(score.contradictions.map((c) => c.field).sort()).toEqual([
      "reviewGate",
      "scopes",
      "source",
    ]);
  });

  it("leaves the cost null when no price is known", () => {
    expect(score.costUsd).toBeNull();
  });
});

describe("scoreApp on a failed run", () => {
  const score = scoreApp(failedCapture(), gmail, 0.04);

  it("reports the failure code and does not count the run as ended in time", () => {
    expect(score).toMatchObject({
      status: "failed",
      failureCode: "NO_PUBLIC_DOCS",
      within120s: false,
    });
  });

  it("scores everything that needs a guide as empty", () => {
    expect(score.scopes.total).toBe(0);
    expect(score.durations.total).toBe(0);
    expect(score.topBlocker.verdict).toBe("none");
    expect(score.gate.verdict).toBe("unknown");
    expect(score.coverage.answered).toEqual([]);
    expect(score.labels.uncertainShare).toBe(0);
  });
});

describe("scoreApp timing", () => {
  it("does not count a run that finished after 120 seconds", () => {
    expect(
      scoreApp({ ...goodCapture(), durationMs: 125_000 }, gmail, null)
        .within120s,
    ).toBe(false);
  });

  it("counts a partial run that finished in time", () => {
    const capture = {
      ...goodCapture(),
      outcome: { ok: true, status: "partial" } as const,
    };
    expect(scoreApp(capture, gmail, null)).toMatchObject({
      status: "partial",
      within120s: true,
    });
  });

  it("reports a retry", () => {
    expect(
      scoreApp({ ...goodCapture(), retried: true }, gmail, null).retries,
    ).toBe(1);
  });
});

describe("scoreApp retrieval and claim quality", () => {
  it("counts the golden pages the search found and the run read", () => {
    expect(scoreApp(goodCapture(), gmail, null).goldenPages).toEqual({
      total: 6,
      inResults: 2,
      fetched: 1,
    });
  });

  it("reports the share of Sourced claims that stand on good pages", () => {
    const good = scoreApp(goodCapture(), gmail, null).claimQuality;
    const broken = scoreApp(brokenCapture(), gmail, null).claimQuality;
    expect(good.wrongProduct).toBe(0);
    expect(good.share).toBeGreaterThan(broken.share);
    expect(broken.wrongProduct).toBeGreaterThan(0);
  });

  it("scores a run that failed before saving as no claims and no pages read", () => {
    const score = scoreApp(failedCapture(), gmail, null);
    expect(score.claimQuality).toMatchObject({ sourced: 0, share: 0 });
    expect(score.goldenPages).toEqual({ total: 6, inResults: 0, fetched: 0 });
  });
});
