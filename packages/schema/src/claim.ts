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

/**
 * A sourced or tested claim needs at least one source. An uncertain claim may have none:
 * that is how an unknown fact is represented, and its text says what is unknown.
 */
export const ClaimSchema = z
  .strictObject({
    id: ClaimIdSchema,
    text: z.string().min(1),
    label: EvidenceLabelSchema,
    sources: z.array(SourceSchema),
  })
  .superRefine((claim, ctx) => {
    if (claim.label !== "uncertain" && claim.sources.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["sources"],
        message: "A sourced or tested claim needs at least one source",
      });
    }
  });
export type Claim = z.infer<typeof ClaimSchema>;
