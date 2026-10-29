/**
 * File: broken-capture.ts
 * Purpose: A Gmail-like RunCapture that repeats the stored-guide failures, for the scoring and scorecard tests.
 * Exports: brokenCapture
 * Used by: evals/scoring/score-app.test.ts, evals/lib/scorecard.test.ts, evals/lib/summary.test.ts, evals/lib/fixtures/run-batch-helpers.ts
 */
import type { RunCapture } from "../types.js";
import { claim, goodCapture, guideWith, unknownClaim } from "./run-capture.js";

/** A run that repeats the stored-guide failures: wrong product, add-on style scopes, prose, a blog as top blocker. */
export function brokenCapture(): RunCapture {
  const wrong =
    "https://docs.cloud.google.com/contact-center/ccai-platform/docs/oauth-email-google";
  const good = goodCapture();
  const guide = guideWith({
    scopes: [
      {
        id: "scopes.0",
        name: "Read open message metadata",
        reason: claim("scopes.0.reason", "Read", "sourced", wrong),
      },
      {
        id: "scopes.1",
        name: "gmail.readonly",
        reason: claim(
          "scopes.1.reason",
          "Read mail",
          "sourced",
          "https://developers.google.com/maps/documentation",
        ),
      },
    ],
    blockers: [
      {
        id: "blockers.0",
        symptom: claim(
          "blockers.0.symptom",
          "Verification is required",
          "sourced",
          "https://www.cloudsponge.com/blog/x",
          "third_party",
        ),
        cause: unknownClaim("blockers.0.cause"),
        fix: unknownClaim("blockers.0.fix"),
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
        effort: claim(
          "m.fe",
          "Use the Quickstart to create a token",
          "uncertain",
        ),
        wait: claim("m.fw", "no wait", "uncertain"),
      },
      production: {
        effort: unknownClaim("m.pe"),
        wait: claim("m.pw", "Several weeks", "uncertain"),
      },
    },
  });
  return {
    ...good,
    guide,
    gates: {
      ...good.gates!,
      reviewGate: "none",
      reviewGateTier: "third_party",
    },
    pages: [{ url: wrong, tier: "official" }],
    durationMs: 23_000,
  };
}
