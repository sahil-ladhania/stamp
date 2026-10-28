/**
 * File: risks.ts
 * Purpose: Blockers, limits, and source-conflict sections on a guide.
 * Exports: BlockerSchema, LimitsSchema, ConflictSchema
 * Used by: guide/guide.ts
 */
import { z } from "zod";
import { ClaimIdSchema, ClaimSchema, SourceSchema } from "../claim.js";

export const BlockerSchema = z.strictObject({
  id: ClaimIdSchema,
  symptom: ClaimSchema,
  cause: ClaimSchema,
  fix: ClaimSchema,
  contact: ClaimSchema.nullable(),
});
export type Blocker = z.infer<typeof BlockerSchema>;

export const LimitsSchema = z.array(ClaimSchema);

export const ConflictSchema = z.strictObject({
  id: ClaimIdSchema,
  topic: z.string().min(1),
  sourceA: SourceSchema,
  sourceB: SourceSchema,
  preferredUrl: z.string().url(),
  reason: ClaimSchema,
});
export type Conflict = z.infer<typeof ConflictSchema>;
