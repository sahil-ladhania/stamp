/**
 * File: claim-lookup.ts
 * Purpose: Finds the verified claim for a slot, or an Uncertain unknown claim when the draft has none or was never verified.
 * Exports: claimLookup, SectionDraftStatus, ClaimResolver
 * Used by: agent/guide/assemble*.ts
 */
import type { Claim } from "@stamp/schema";
import type { DraftClaim } from "../draft-claim.js";
import {
  makeUnknownClaim,
  unknownWhy,
  type UnknownWhy,
} from "./unknown-claim.js";

export type SectionDraftStatus = Parameters<typeof unknownWhy>[0];
export type ClaimResolver = (
  id: string,
  draft: DraftClaim | null,
  whyMissing?: UnknownWhy,
) => Claim;

/**
 * A draft claim becomes the verified claim with the same id. If verify never saw it (the budget stopped the
 * run first, or a retry pass replaced the draft afterwards) the text no longer matches, and the slot is unknown:
 * an unchecked claim is never shown as researched. A null draft is unknown for `whyMissing` (default: not found).
 */
export function claimLookup(claims: readonly Claim[]): ClaimResolver {
  const byId = new Map(claims.map((claim) => [claim.id, claim]));
  return (id, draft, whyMissing = "not_found") => {
    if (draft === null) return makeUnknownClaim(id, whyMissing);
    const verified = byId.get(id);
    return verified?.text === draft.text
      ? verified
      : makeUnknownClaim(id, "time_budget");
  };
}
