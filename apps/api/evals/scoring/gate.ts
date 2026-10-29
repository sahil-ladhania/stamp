/**
 * File: gate.ts
 * Purpose: Scores the review gate and approval wait the agent found against the golden set: match, wrong, or an honest unknown.
 * Exports: scoreGate, scoreWait, describeWait, Verdict
 * Used by: evals/scoring/score-app.ts, evals/scoring/contradictions.ts
 */
import type {
  ApprovalWait,
  ReviewGate,
} from "../../src/agent/scoring/difficulty.js";
import type { Golden } from "../lib/golden.js";

/** Whether a found value matches the golden set; "unknown" is an honest gap, not an error. */
export type Verdict = "match" | "unknown" | "wrong";

type Days = { min: number; max: number };

/** A gate is a match when it is the golden primary or its one alternate. */
export function scoreGate(found: ReviewGate, golden: Golden): Verdict {
  if (found === "unknown") return "unknown";
  const accepted = [golden.reviewGate.value, ...golden.reviewGate.alsoAccept];
  return accepted.includes(found) ? "match" : "wrong";
}

/** No approval step counts as zero days, so it can be compared with a range. */
function foundDays(wait: ApprovalWait): Days | null {
  if (wait === "unknown") return null;
  if (wait === "none") return { min: 0, max: 0 };
  return { min: wait.minDays, max: wait.maxDays };
}

function goldenDays(golden: Golden): Days[] {
  const wait = golden.approvalWait;
  if (wait.kind === "none") return [{ min: 0, max: 0 }];
  if (wait.kind === "unknown") return [];
  const primary = { min: wait.minDays ?? 0, max: wait.maxDays ?? 0 };
  const alternate = (wait.alsoValid ?? []).map((range) => ({
    min: range.minDays,
    max: range.maxDays,
  }));
  return [primary, ...alternate];
}

/**
 * Provider waits are estimates, so each golden range is widened to half its minimum and twice its maximum
 * before it is compared. A found range that does not touch it is wrong.
 */
function overlapsWidened(found: Days, golden: Days): boolean {
  return found.max >= golden.min / 2 && found.min <= golden.max * 2;
}

/**
 * Where the golden documents no wait, any invented number is wrong; "no wait" is a match only when the
 * golden also accepts a gate of none.
 */
export function scoreWait(found: ApprovalWait, golden: Golden): Verdict {
  const days = foundDays(found);
  if (days === null) return "unknown";
  if (golden.approvalWait.kind === "unknown") {
    const acceptsNone = [
      golden.reviewGate.value,
      ...golden.reviewGate.alsoAccept,
    ].includes("none");
    return found === "none" && acceptsNone ? "match" : "wrong";
  }
  return goldenDays(golden).some((range) => overlapsWidened(days, range))
    ? "match"
    : "wrong";
}

/** The wait as the scorecard prints it. */
export function describeWait(wait: ApprovalWait): string {
  if (wait === "unknown" || wait === "none") return wait;
  return wait.minDays === wait.maxDays
    ? `${wait.minDays} days`
    : `${wait.minDays} to ${wait.maxDays} days`;
}
