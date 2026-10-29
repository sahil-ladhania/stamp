/**
 * File: gates-normalize.ts
 * Purpose: The rule that a gates fact with no evidence is unknown, shared by the extract-time cleaning and the verify-time quote check.
 * Exports: withoutUnevidencedFacts
 * Used by: agent/extract/sanitize.ts, agent/verify/verify-gates.ts
 */
import type { SectionOutput } from "./sections.js";

/** A review gate is about review: a quote behind one (other than "none") must use a word of this kind. */
const REVIEW_WORDS =
  /review|approv|assess|audit|listing|vett|certif|verif|compliance|submit/i;

/**
 * Sets the auth method, review gate and approval wait back to unknown when the claim that backs them is
 * gone, and clears the wait's days unless it is a known range. A review gate other than "none" is also
 * unknown when its quote has no review, approval, assessment, listing or vetting word. Nothing here adds a fact.
 */
export function withoutUnevidencedFacts(
  gates: SectionOutput<"gates">,
): SectionOutput<"gates"> {
  const waitKnown =
    gates.approvalWait !== "unknown" && gates.approvalWaitEvidence !== null;
  const isRange = waitKnown && gates.approvalWait === "range";
  return {
    ...gates,
    authMethod: gates.authEvidence ? gates.authMethod : "unknown",
    reviewGate: reviewGateStands(gates) ? gates.reviewGate : "unknown",
    approvalWait: waitKnown ? gates.approvalWait : "unknown",
    approvalWaitMinDays: isRange ? gates.approvalWaitMinDays : null,
    approvalWaitMaxDays: isRange ? gates.approvalWaitMaxDays : null,
  };
}

const reviewGateStands = (gates: SectionOutput<"gates">): boolean =>
  gates.reviewGateEvidence !== null &&
  (gates.reviewGate === "none" ||
    REVIEW_WORDS.test(gates.reviewGateEvidence.quote));
