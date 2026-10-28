/**
 * File: claim.ts
 * Purpose: Source and Claim shapes for guide JSON and API responses.
 * Exports: SourceSchema, ClaimSchema, ClaimIdSchema
 * Used by: guide/*, index.ts
 */
import { z } from "zod";
import { EvidenceLabelSchema, SourceTierSchema } from "./enums.js";

/** Stable path inside a guide, e.g. steps.5 or blockers.2.symptom. */
export const ClaimIdSchema = z
  .string()
  .min(1)
  .regex(/^[a-z][a-z0-9_]*(\.[a-zA-Z0-9][a-zA-Z0-9_]*)*$/);
export type ClaimId = z.infer<typeof ClaimIdSchema>;

export const SourceSchema = z.strictObject({
  url: z.string().url(),
  quote: z.string().min(1),
  tier: SourceTierSchema,
  retrievedAt: z.string().datetime().optional(),
});
export type Source = z.infer<typeof SourceSchema>;

export const ClaimSchema = z.strictObject({
  id: ClaimIdSchema,
  text: z.string().min(1),
  label: EvidenceLabelSchema,
  sources: z.array(SourceSchema).min(1),
});
export type Claim = z.infer<typeof ClaimSchema>;
