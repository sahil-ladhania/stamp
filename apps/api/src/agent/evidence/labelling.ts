/**
 * File: labelling.ts
 * Purpose: Decides a claim's evidence label from code-checked facts; the model never sets a label.
 * Exports: labelClaim, applyProbe, LabelInput, LabelDecision, ProbeOutcome
 * Used by: agent/verify/verify-claims.ts, agent/nodes/probe.ts
 */
import type { DowngradeReason, EvidenceLabel } from "@stamp/schema";
import type { QuoteMatch } from "./quote-match.js";

export type LabelInput = {
  quote: QuoteMatch;
  /** True when a confirmed conflict (see conflicts.ts) involves this claim. */
  conflicted: boolean;
  /** Milestone effort and wait claims: estimates stay Uncertain until tested. */
  isTimeEstimate: boolean;
};

export type LabelDecision = {
  /** Verify only ever produces sourced or uncertain; tested comes from the probe. */
  label: Extract<EvidenceLabel, "sourced" | "uncertain">;
  /** Set when a check failed and a claim.downgraded event should follow; null otherwise. */
  downgrade: DowngradeReason | null;
};

/**
 * Order matters. A missing quote is a failed check, so it is reported even for time estimates.
 * A time estimate with a matching quote is Uncertain by rule, not by failure, so no downgrade is reported.
 */
export function labelClaim(input: LabelInput): LabelDecision {
  if (!input.quote.matched) {
    return { label: "uncertain", downgrade: "quote_not_found" };
  }
  if (input.conflicted) {
    return { label: "uncertain", downgrade: "sources_disagree" };
  }
  if (input.isTimeEstimate) {
    return { label: "uncertain", downgrade: null };
  }
  return { label: "sourced", downgrade: null };
}

export type ProbeOutcome = "passed" | "failed" | "skipped";

/**
 * The only way to reach tested: a claim already sourced and confirmed by a passing probe.
 * A failed or skipped probe changes nothing, and an uncertain claim is never promoted.
 */
export function applyProbe(
  label: EvidenceLabel,
  probe: ProbeOutcome,
): EvidenceLabel {
  return label === "sourced" && probe === "passed" ? "tested" : label;
}
