/**
 * File: extraction.ts
 * Purpose: Zod schemas for model structured output per guide section (no labels or scores).
 * Exports: Extract*OutputSchema for each section
 * Used by: agent extract node, prompts
 */
import { z } from "zod";
import { ActorSchema } from "@stamp/schema";
import { DraftClaimSchema } from "./draft-claim.js";

export const ExtractVerdictOutputSchema = z.strictObject({
  summary: DraftClaimSchema,
  nextStepIndex: z.number().int().nonnegative().nullable(),
  topBlockerIndex: z.number().int().nonnegative().nullable(),
});

export const ExtractMilestonesOutputSchema = z.strictObject({
  firstTestEffort: DraftClaimSchema,
  firstTestWait: DraftClaimSchema,
  productionEffort: DraftClaimSchema,
  productionWait: DraftClaimSchema,
});

export const ExtractRequirementsOutputSchema = z.strictObject({
  requirements: z.array(DraftClaimSchema),
});

const ExtractScopeItemSchema = z.strictObject({
  name: z.string().min(1),
  reason: DraftClaimSchema,
});

export const ExtractScopesOutputSchema = z.strictObject({
  scopes: z.array(ExtractScopeItemSchema),
});

const ExtractStepItemSchema = z.strictObject({
  title: z.string().min(1),
  detail: DraftClaimSchema,
  actor: ActorSchema,
  effort: DraftClaimSchema,
});

export const ExtractStepsOutputSchema = z.strictObject({
  steps: z.array(ExtractStepItemSchema),
});

const ExtractBlockerItemSchema = z.strictObject({
  symptom: DraftClaimSchema,
  cause: DraftClaimSchema,
  fix: DraftClaimSchema,
  contact: DraftClaimSchema.nullable(),
});

export const ExtractBlockersOutputSchema = z.strictObject({
  blockers: z.array(ExtractBlockerItemSchema),
});

export const ExtractLimitsOutputSchema = z.strictObject({
  limits: z.array(DraftClaimSchema),
});

export const ExtractConflictsOutputSchema = z.strictObject({
  conflicts: z.array(
    z.strictObject({
      topic: z.string().min(1),
      sourceA: DraftClaimSchema,
      sourceB: DraftClaimSchema,
      preferredUrl: z.string().url(),
      reason: DraftClaimSchema,
    }),
  ),
});
