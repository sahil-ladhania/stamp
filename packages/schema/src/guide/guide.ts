/**
 * File: guide.ts
 * Purpose: Full guide document and library list item schemas.
 * Exports: GuideSchema, GuideSummarySchema
 * Used by: index.ts, apps/api mappers, apps/web
 */
import { z } from "zod";
import { SCHEMA_VERSION } from "../constants.js";
import {
  ArchetypeSchema,
  GuideCoverageSchema,
  GuideModeSchema,
} from "../enums.js";
import { DifficultyBreakdownSchema } from "./difficulty.js";
import { GlossarySchema } from "./glossary.js";
import { RequirementsSchema, ScopeSchema, StepSchema } from "./setup.js";
import { BlockerSchema, ConflictSchema, LimitsSchema } from "./risks.js";
import { MilestonesSchema, VerdictSchema } from "./verdict.js";

export const GuideSummarySchema = z.strictObject({
  slug: z.string().min(1),
  appName: z.string().min(1),
  archetype: ArchetypeSchema,
  difficulty: z.number().int().min(1).max(5),
  mode: GuideModeSchema,
  asOf: z.string().min(1),
});
export type GuideSummary = z.infer<typeof GuideSummarySchema>;

export const GuideSchema = z.strictObject({
  schemaVersion: z.literal(SCHEMA_VERSION),
  slug: z.string().min(1),
  appName: z.string().min(1),
  domain: z.string().min(1),
  mode: GuideModeSchema,
  archetype: ArchetypeSchema,
  difficulty: z.number().int().min(1).max(5),
  asOf: z.string().min(1),
  coverage: GuideCoverageSchema,
  verdict: VerdictSchema,
  milestones: MilestonesSchema,
  requirements: RequirementsSchema,
  scopes: z.array(ScopeSchema),
  steps: z.array(StepSchema),
  blockers: z.array(BlockerSchema),
  limits: LimitsSchema,
  conflicts: z.array(ConflictSchema),
  difficultyBreakdown: DifficultyBreakdownSchema,
  glossary: GlossarySchema.optional(),
});
export type Guide = z.infer<typeof GuideSchema>;
