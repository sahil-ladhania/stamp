/**
 * File: verdict.ts
 * Purpose: Verdict stamp and milestone sections on a guide.
 * Exports: VerdictSchema, MilestonePairSchema, MilestonesSchema
 * Used by: guide/guide.ts
 */
import { z } from "zod";
import { ClaimIdSchema, ClaimSchema } from "../claim.js";

export const MilestonePairSchema = z.strictObject({
  effort: ClaimSchema,
  wait: ClaimSchema,
});
export type MilestonePair = z.infer<typeof MilestonePairSchema>;

export const MilestonesSchema = z.strictObject({
  firstTest: MilestonePairSchema,
  production: MilestonePairSchema,
});
export type Milestones = z.infer<typeof MilestonesSchema>;

export const VerdictSchema = z.strictObject({
  summary: ClaimSchema,
  nextStepId: ClaimIdSchema.nullable(),
  topBlockerId: ClaimIdSchema.nullable(),
});
export type Verdict = z.infer<typeof VerdictSchema>;
