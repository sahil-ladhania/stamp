/**
 * File: run-capture.ts
 * Purpose: Builders for a Gmail-like RunCapture, good or failed, for the scoring and scorecard tests.
 * Exports: claim, unknownClaim, guideWith, goodCapture, failedCapture
 * Used by: evals/scoring/score-app.test.ts, evals/lib/scorecard.test.ts, evals/lib/run-batch.test.ts
 */
import type { Claim, Guide, SourceTier } from "@stamp/schema";
import { build } from "../../../src/test-support/assemble-helpers.js";
import {
  emptyUsage,
  type PageInfo,
  type RunCapture,
  type TraceEvent,
} from "../types.js";

const OFFICIAL =
  "https://developers.google.com/workspace/gmail/api/auth/scopes";

/** A claim with one source when it is Sourced or Tested, none when Uncertain. */
export function claim(
  id: string,
  text: string,
  label: Claim["label"] = "sourced",
  url: string = OFFICIAL,
  tier: SourceTier = "official",
): Claim {
  return {
    id,
    text,
    label,
    sources:
      label === "uncertain"
        ? []
        : [{ url, quote: "a quote from the page", tier }],
  };
}

export const unknownClaim = (id: string): Claim =>
  claim(id, "Not found in the fetched sources.", "uncertain");

export function guideWith(parts: Partial<Guide>): Guide {
  return {
    ...build(),
    slug: "gmail",
    appName: "Gmail API",
    domain: "google.com",
    ...parts,
  };
}

/** Fields every capture shares; a function so each capture owns its arrays. */
const base = () => ({
  slug: "gmail",
  typed: "Gmail",
  startedAt: "2026-10-29T10:00:00.000Z",
  stageReached: 8,
  retried: false,
  searchResults: [] as PageInfo[],
  events: [] as TraceEvent[],
  logs: [] as Record<string, unknown>[],
  models: { fast: "gpt-4.1-mini", strong: "gpt-4.1" },
});

/** A run that matches the golden set: right gate and wait, real scopes, durations, an official top blocker. */
export function goodCapture(): RunCapture {
  const guide = guideWith({
    scopes: [
      {
        id: "scopes.0",
        name: "https://www.googleapis.com/auth/gmail.readonly",
        reason: claim("scopes.0.reason", "Read mail"),
      },
      {
        id: "scopes.1",
        name: "https://www.googleapis.com/auth/gmail.send",
        reason: claim("scopes.1.reason", "Send mail"),
      },
    ],
    blockers: [
      {
        id: "blockers.0",
        symptom: claim(
          "blockers.0.symptom",
          "Restricted scopes need a security assessment",
        ),
        cause: claim(
          "blockers.0.cause",
          "Google requires an annual assessment",
        ),
        fix: claim("blockers.0.fix", "Hire an approved assessor"),
        contact: null,
      },
    ],
    verdict: {
      summary: claim("verdict.summary", "Hard"),
      nextStepId: null,
      topBlockerId: "blockers.0",
    },
    milestones: {
      firstTest: {
        effort: claim("m.fe", "30 minutes", "uncertain"),
        wait: claim("m.fw", "no wait", "uncertain"),
      },
      production: {
        effort: claim("m.pe", "2 to 4 weeks", "uncertain"),
        wait: claim("m.pw", "6 weeks", "uncertain"),
      },
    },
    steps: [
      {
        id: "steps.0",
        title: "Create a project",
        detail: claim("steps.0.detail", "Create a Google Cloud project"),
        actor: "human",
        effort: unknownClaim("steps.0.effort"),
      },
    ],
  });
  return {
    ...base(),
    outcome: { ok: true, status: "done" },
    durationMs: 61_000,
    guide,
    gates: {
      reviewGate: "security_assessment",
      reviewGateTier: "official",
      approvalWait: { minDays: 42, maxDays: 42 },
      approvalWaitTier: "official",
    },
    pages: [{ url: OFFICIAL, tier: "official" }],
    usage: {
      ...emptyUsage(),
      strongCalls: 10,
      strongInputTokens: 36_000,
      strongOutputTokens: 1_800,
      totalTokens: 38_000,
      tavilyCredits: 11,
      pagesFetched: 6,
    },
  };
}

/** A run that failed before saving: no guide, no gates. */
export function failedCapture(): RunCapture {
  return {
    ...base(),
    outcome: { ok: false, code: "NO_PUBLIC_DOCS" },
    durationMs: 9_000,
    stageReached: 3,
    guide: null,
    gates: null,
    pages: [],
    usage: { ...emptyUsage(), tavilyCredits: 4 },
  };
}
