/**
 * File: label-claim.ts
 * Purpose: Build a labelled Claim from a draft fact; label is chosen by caller (verify code).
 * Exports: toLabelledClaim
 * Used by: agent/verify/verify-claims.ts
 */
import type { Claim, ClaimId, EvidenceLabel, SourceTier } from "@stamp/schema";
import type { DraftClaim } from "./draft-claim.js";

/** Copies draft text into a Claim with the given label and tier from the page record; `retrievedAt` is when the page was fetched. */
export function toLabelledClaim(
  draft: DraftClaim,
  label: EvidenceLabel,
  id: ClaimId,
  tier: SourceTier,
  retrievedAt?: string,
): Claim {
  return {
    id,
    text: draft.text,
    label,
    sources: [
      {
        url: draft.url,
        quote: draft.quote,
        tier,
        ...(retrievedAt === undefined ? {} : { retrievedAt }),
      },
    ],
  };
}
