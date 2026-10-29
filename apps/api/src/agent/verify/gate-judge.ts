/**
 * File: gate-judge.ts
 * Purpose: Puts the review gate and the approval wait through the support check: code writes a sentence from each value, and a gate or wait its quote does not support becomes unknown.
 * Exports: gateItems, applyToGates
 * Used by: agent/nodes/verify.ts
 */
import { withoutUnevidencedFacts } from "../extract/gates-normalize.js";
import type { SectionOutput } from "../extract/sections.js";
import type { JudgeItem } from "../prompts/support-judge.js";
import { pageOf, reasonOf, type Verdict } from "./support-judge.js";

type Gates = SectionOutput<"gates">;

const GATE_SENTENCES: Record<
  Exclude<Gates["reviewGate"], "unknown">,
  string
> = {
  none: "Apps do not need any review or approval by the provider.",
  optional_listing:
    "Apps can be used without review; listing in the provider's marketplace is optional and reviewed.",
  required_to_scale:
    "The provider must review or approve an app before it can be used beyond a small number of accounts.",
  security_assessment:
    "The provider requires a security assessment of the app.",
  partner_vetting:
    "The provider requires the app maker to become a vetted partner.",
};

/** The review gate and the approval wait, as sentences code writes from their values, with the quote that backs each. */
export function gateItems(gates: Gates): JudgeItem[] {
  const items: JudgeItem[] = [];
  const review = gates.reviewGateEvidence;
  if (review && gates.reviewGate !== "unknown") {
    items.push({
      id: "gates.reviewGate",
      claim: GATE_SENTENCES[gates.reviewGate],
      quote: review.quote,
      page: pageOf(review.url, undefined),
    });
  }
  const wait = gates.approvalWaitEvidence;
  if (wait && gates.approvalWait !== "unknown") {
    const days =
      gates.approvalWait === "range"
        ? `${gates.approvalWaitMinDays} to ${gates.approvalWaitMaxDays} days`
        : "no time";
    items.push({
      id: "gates.approvalWait",
      claim: `App approval by the provider takes ${days}.`,
      quote: wait.quote,
      page: pageOf(wait.url, undefined),
    });
  }
  return items;
}

/** A review gate or wait the verdicts reject loses its evidence, so it is unknown and the score never counts it. */
export function applyToGates(
  gates: Gates,
  verdicts: ReadonlyMap<string, Verdict>,
): Gates {
  const rejected = (id: string): boolean => {
    const verdict = verdicts.get(id);
    return verdict !== undefined && reasonOf(verdict) !== null;
  };
  return withoutUnevidencedFacts({
    ...gates,
    reviewGateEvidence: rejected("gates.reviewGate")
      ? null
      : gates.reviewGateEvidence,
    approvalWaitEvidence: rejected("gates.approvalWait")
      ? null
      : gates.approvalWaitEvidence,
  });
}
