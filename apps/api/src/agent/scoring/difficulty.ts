/**
 * File: difficulty.ts
 * Purpose: The difficulty rule from docs/solution.md: four factors, a total of 0 to 9 and a score of 1 to 5.
 * Exports: scoreDifficulty, reviewGatePoints, approvalWaitPoints, GateFacts, ReviewGate, ApprovalWait
 * Used by: agent/nodes/score.ts, agent/scoring/archetype.ts
 */
import {
  difficultyScoreForTotal,
  type DifficultyBreakdown,
} from "@stamp/schema";

/** "unknown" means not found or not verified against a source; it counts as no gate (a lower bound). */
export type ReviewGate =
  | "unknown"
  | "none"
  | "optional_listing"
  | "required_to_scale"
  | "security_assessment"
  | "partner_vetting";

/** "none" means no approval step exists; a range is in days; "unknown" is not found or not verified. */
export type ApprovalWait =
  "unknown" | "none" | { minDays: number; maxDays: number };

/** Facts the gates extraction returns, each already checked against a source quote by code. */
export type GateFacts = {
  reviewGate: ReviewGate;
  approvalWait: ApprovalWait;
  /** Distinct prerequisites before setup can start (paid plan, verified domain, ...). */
  prerequisites: number;
  /** Caps and limits that appear only after launch (install caps, rate limits, ...). */
  hiddenLimits: number;
  /** Used by the archetype rule only; it adds no difficulty points. */
  needsEnterprisePlan: boolean;
};

const DAYS_PER_WEEK = 7;

const REVIEW_GATE_POINTS: Record<ReviewGate, number> = {
  unknown: 0,
  none: 0,
  optional_listing: 1,
  required_to_scale: 2,
  security_assessment: 3,
  partner_vetting: 3,
};

function assertCount(name: string, value: number): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(
      `${name} must be a non-negative integer, got ${value}`,
    );
  }
}

/** Review gate points: none 0, optional listing 1, required to scale 2, assessment or vetting 3. */
export function reviewGatePoints(gate: ReviewGate): number {
  return REVIEW_GATE_POINTS[gate];
}

/**
 * Approval wait points, from the upper end of the range: under 1 day 0, up to 7 days 1,
 * up to 4 weeks 2, longer 3. An unknown wait counts 2, as the doc says.
 */
export function approvalWaitPoints(wait: ApprovalWait): number {
  if (wait === "none") {
    return 0;
  }
  if (wait === "unknown") {
    return 2;
  }
  const { minDays, maxDays } = wait;
  if (
    !Number.isFinite(minDays) ||
    !Number.isFinite(maxDays) ||
    minDays < 0 ||
    maxDays < minDays
  ) {
    throw new RangeError(
      `Invalid approval wait range: ${minDays} to ${maxDays} days`,
    );
  }
  if (maxDays < 1) {
    return 0;
  }
  if (maxDays <= DAYS_PER_WEEK) {
    return 1;
  }
  return maxDays <= 4 * DAYS_PER_WEEK ? 2 : 3;
}

/**
 * Computes the breakdown with fixed rules only, never from a model's opinion.
 * A verified "none" review gate means there is no approval step, so the wait costs 0 whatever it says.
 */
export function scoreDifficulty(facts: GateFacts): DifficultyBreakdown {
  assertCount("prerequisites", facts.prerequisites);
  assertCount("hiddenLimits", facts.hiddenLimits);

  const reviewGate = reviewGatePoints(facts.reviewGate);
  const approvalWait =
    facts.reviewGate === "none" ? 0 : approvalWaitPoints(facts.approvalWait);
  const prerequisites = Math.min(facts.prerequisites, 2);
  const hiddenLimits = facts.hiddenLimits > 0 ? 1 : 0;
  const total = reviewGate + approvalWait + prerequisites + hiddenLimits;
  return {
    reviewGate,
    approvalWait,
    prerequisites,
    hiddenLimits,
    total,
    score: difficultyScoreForTotal(total),
  };
}
