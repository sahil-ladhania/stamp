/**
 * File: gates-normalize.ts
 * Purpose: The rule that a gates fact with no evidence is unknown, shared by the extract-time cleaning and the verify-time quote check.
 * Exports: withoutUnevidencedFacts
 * Used by: agent/extract/sanitize.ts, agent/verify/verify-gates.ts
 */
import type { SectionOutput } from "./sections.js";

/**
 * Sets the auth method, review gate and approval wait back to unknown when the claim that backs them is
 * gone, and clears the wait's days unless it is a known range. Nothing here adds a fact.
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
    reviewGate: gates.reviewGateEvidence ? gates.reviewGate : "unknown",
    approvalWait: waitKnown ? gates.approvalWait : "unknown",
    approvalWaitMinDays: isRange ? gates.approvalWaitMinDays : null,
    approvalWaitMaxDays: isRange ? gates.approvalWaitMaxDays : null,
  };
}
