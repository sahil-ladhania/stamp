/**
 * File: verify-gates.ts
 * Purpose: Checks every quote that backs a gates fact; a fact whose quote is not on its page becomes unknown, so the score never counts it.
 * Exports: verifyGates, VerifiedGates
 * Used by: agent/nodes/verify.ts
 */
import type { CheckRecord } from "../../services/verification-log.js";
import type { DraftClaim } from "../draft-claim.js";
import { withoutUnevidencedFacts } from "../extract/gates-normalize.js";
import type { PageIndex } from "../extract/sanitize.js";
import type { SectionOutput } from "../extract/sections.js";
import { checkQuote } from "./check-quote.js";

type Gates = SectionOutput<"gates">;
export type VerifiedGates = { gates: Gates; checks: CheckRecord[] };

/** The gates with only their verified evidence left, and one check record per quote looked at. */
export function verifyGates(
  gates: Gates | null,
  pages: PageIndex,
): VerifiedGates | null {
  if (gates === null) {
    return null;
  }
  const checks: CheckRecord[] = [];
  const keep = (
    claimId: string,
    draft: DraftClaim | null,
  ): DraftClaim | null => {
    if (draft === null) return null;
    const check = checkQuote(claimId, draft, pages);
    checks.push(check.record);
    return check.match.matched ? draft : null;
  };
  const keepAll = (prefix: string, drafts: DraftClaim[]): DraftClaim[] =>
    drafts.flatMap((draft, i) => keep(`${prefix}.${i}`, draft) ?? []);

  const verified = withoutUnevidencedFacts({
    ...gates,
    authEvidence: keep("gates.authEvidence", gates.authEvidence),
    reviewGateEvidence: keep(
      "gates.reviewGateEvidence",
      gates.reviewGateEvidence,
    ),
    approvalWaitEvidence: keep(
      "gates.approvalWaitEvidence",
      gates.approvalWaitEvidence,
    ),
    prerequisites: keepAll("gates.prerequisites", gates.prerequisites),
    hiddenLimits: keepAll("gates.hiddenLimits", gates.hiddenLimits),
    enterprisePlanEvidence: keep(
      "gates.enterprisePlanEvidence",
      gates.enterprisePlanEvidence,
    ),
  });
  return { gates: verified, checks };
}
