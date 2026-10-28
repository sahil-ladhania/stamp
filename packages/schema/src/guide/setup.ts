/**
 * File: setup.ts
 * Purpose: Requirements, scopes, and steps sections on a guide.
 * Exports: Requirement list, ScopeSchema, StepSchema
 * Used by: guide/guide.ts
 */
import { z } from "zod";
import { ActorSchema } from "../enums.js";
import { ClaimIdSchema, ClaimSchema } from "../claim.js";

export const ScopeSchema = z.strictObject({
  id: ClaimIdSchema,
  name: z.string().min(1),
  reason: ClaimSchema,
});
export type Scope = z.infer<typeof ScopeSchema>;

export const StepSchema = z.strictObject({
  id: ClaimIdSchema,
  title: z.string().min(1),
  detail: ClaimSchema,
  actor: ActorSchema,
  effort: ClaimSchema,
});
export type Step = z.infer<typeof StepSchema>;

export const RequirementsSchema = z.array(ClaimSchema);
