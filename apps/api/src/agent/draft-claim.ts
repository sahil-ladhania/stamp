/**
 * File: draft-claim.ts
 * Purpose: Model extraction shape for a fact before code assigns a label.
 * Exports: DraftClaimSchema, DraftClaim
 * Used by: agent extraction schemas, label-claim.ts
 */
import { z } from "zod";

export const DraftClaimSchema = z.strictObject({
  text: z.string().min(1),
  quote: z.string().min(1),
  url: z.string().url(),
});
export type DraftClaim = z.infer<typeof DraftClaimSchema>;
