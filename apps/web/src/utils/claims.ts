/**
 * File: claims.ts
 * Purpose: Collects every claim in a guide and counts them by evidence label, for the verification summary.
 * Exports: collectClaims, countByLabel
 * Used by: components/guide/VerificationSummary.tsx
 */
import type { Claim, EvidenceKind, Guide } from "@/mocks/types";

/** Milestone, step, blocker and conflict claims. Sources and the difficulty score are not claims. */
export function collectClaims(guide: Guide): Claim[] {
  return [
    ...guide.milestones.flatMap((milestone) => milestone.claims),
    ...guide.steps.map((step) => step.claim),
    ...guide.blockers.map((blocker) => blocker.claim),
    ...guide.conflicts.flatMap((conflict) =>
      conflict.options.map((option) => option.claim),
    ),
  ];
}

export function countByLabel(
  claims: readonly Claim[],
): Record<EvidenceKind, number> {
  const counts: Record<EvidenceKind, number> = {
    tested: 0,
    sourced: 0,
    uncertain: 0,
  };
  for (const claim of claims) counts[claim.label] += 1;
  return counts;
}
