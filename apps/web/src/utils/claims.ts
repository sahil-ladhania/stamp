/**
 * File: claims.ts
 * Purpose: Counts claims by evidence label, for the verification summary.
 * Exports: countByLabel
 * Used by: components/guide/VerificationBar.tsx, utils/confirmed-summary.ts
 */
import type { Claim, EvidenceKind } from "@/types/guide-model";

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
