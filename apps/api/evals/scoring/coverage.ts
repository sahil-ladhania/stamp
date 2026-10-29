/**
 * File: coverage.ts
 * Purpose: Scores which of the five key fields a guide answers with something firmer than an Uncertain claim.
 * Exports: scoreCoverage, COVERAGE_FIELDS, CoverageGuide
 * Used by: evals/scoring/score-app.ts
 */
import type { Claim, Guide } from "@stamp/schema";
import type {
  ApprovalWait,
  ReviewGate,
} from "../../src/agent/scoring/difficulty.js";

export type CoverageGuide = Pick<Guide, "scopes" | "steps" | "blockers">;

export const COVERAGE_FIELDS = [
  "reviewGate",
  "approvalWait",
  "scopes",
  "blockers",
  "steps",
] as const;

const firm = (claim: Claim): boolean => claim.label !== "uncertain";

/** A field is answered when a verified fact backs it: the gate and wait are known, the lists hold a Sourced or Tested claim. */
export function scoreCoverage(input: {
  gate: ReviewGate;
  wait: ApprovalWait;
  guide: CoverageGuide | null;
}): { answered: string[]; missing: string[] } {
  const { guide } = input;
  const answeredBy: Record<(typeof COVERAGE_FIELDS)[number], boolean> = {
    reviewGate: input.gate !== "unknown",
    approvalWait: input.wait !== "unknown",
    scopes: guide?.scopes.some((scope) => firm(scope.reason)) ?? false,
    blockers:
      guide?.blockers.some((blocker) =>
        [blocker.symptom, blocker.cause, blocker.fix].some(firm),
      ) ?? false,
    steps: guide?.steps.some((step) => firm(step.detail)) ?? false,
  };
  return {
    answered: COVERAGE_FIELDS.filter((field) => answeredBy[field]),
    missing: COVERAGE_FIELDS.filter((field) => !answeredBy[field]),
  };
}
