/**
 * File: extraction.ts
 * Purpose: Zod schemas for model structured output per guide section (no labels or scores). A null claim or an empty list means "unknown".
 * Exports: Extract*OutputSchema for each section, AuthMethodSchema, ReviewGateOptions
 * Used by: agent extract node, prompts
 */
import { z } from "zod";
import { ActorSchema } from "@stamp/schema";
import { DraftClaimSchema } from "./draft-claim.js";
import type { ReviewGate } from "./scoring/difficulty.js";

const Unknown = DraftClaimSchema.nullable();

export const ExtractVerdictOutputSchema = z.strictObject({
  summary: Unknown,
  nextStepIndex: z.number().int().nonnegative().nullable(),
  topBlockerIndex: z.number().int().nonnegative().nullable(),
});

export const ExtractMilestonesOutputSchema = z.strictObject({
  firstTestEffort: Unknown,
  firstTestWait: Unknown,
  productionEffort: Unknown,
  productionWait: Unknown,
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
  effort: Unknown,
});

export const ExtractStepsOutputSchema = z.strictObject({
  steps: z.array(ExtractStepItemSchema),
});

const ExtractBlockerItemSchema = z.strictObject({
  symptom: DraftClaimSchema,
  cause: Unknown,
  fix: Unknown,
  contact: Unknown,
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

export const AuthMethodSchema = z.enum([
  "oauth",
  "both",
  "api_key_only",
  "unknown",
]);

/** The review gates the difficulty rule scores; checked against the rule's own type. */
export const ReviewGateOptions = [
  "unknown",
  "none",
  "optional_listing",
  "required_to_scale",
  "security_assessment",
  "partner_vetting",
] as const satisfies readonly ReviewGate[];

/**
 * The facts behind the difficulty score and the NOT_OAUTH decision. Each fact carries the claim (quote and
 * URL) that backs it; code checks the quote later, and a fact with no checked quote counts as unknown.
 */
export const ExtractGatesOutputSchema = z
  .strictObject({
    authMethod: AuthMethodSchema,
    authEvidence: Unknown,
    reviewGate: z.enum(ReviewGateOptions),
    reviewGateEvidence: Unknown,
    approvalWait: z.enum(["unknown", "none", "range"]),
    approvalWaitMinDays: z.number().int().nonnegative().nullable(),
    approvalWaitMaxDays: z.number().int().nonnegative().nullable(),
    approvalWaitEvidence: Unknown,
    prerequisites: z.array(DraftClaimSchema),
    hiddenLimits: z.array(DraftClaimSchema),
    enterprisePlanEvidence: Unknown,
  })
  .superRefine((gates, ctx) => {
    if (gates.approvalWait !== "range") {
      return;
    }
    const { approvalWaitMinDays: min, approvalWaitMaxDays: max } = gates;
    if (min === null || max === null || min > max) {
      ctx.addIssue({
        code: "custom",
        path: ["approvalWaitMinDays"],
        message:
          'approvalWait "range" needs approvalWaitMinDays and approvalWaitMaxDays, with min not above max',
      });
    }
  });
