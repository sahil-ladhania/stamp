/**
 * File: sections.ts
 * Purpose: The nine extraction sections: their output schemas, the order they run in, and their types.
 * Exports: SECTION_SCHEMAS, SectionId, DraftSectionId, SectionOutput, FIRST_WAVE
 * Used by: agent/extract/*, agent/state.ts, agent/nodes/extract.ts, agent/prompts/extract.ts
 */
import type { z } from "zod";
import {
  ExtractBlockersOutputSchema,
  ExtractConflictsOutputSchema,
  ExtractGatesOutputSchema,
  ExtractLimitsOutputSchema,
  ExtractMilestonesOutputSchema,
  ExtractRequirementsOutputSchema,
  ExtractScopesOutputSchema,
  ExtractStepsOutputSchema,
  ExtractVerdictOutputSchema,
} from "../extraction.js";

export const SECTION_SCHEMAS = {
  steps: ExtractStepsOutputSchema,
  scopes: ExtractScopesOutputSchema,
  requirements: ExtractRequirementsOutputSchema,
  blockers: ExtractBlockersOutputSchema,
  milestones: ExtractMilestonesOutputSchema,
  gates: ExtractGatesOutputSchema,
  limits: ExtractLimitsOutputSchema,
  conflicts: ExtractConflictsOutputSchema,
  verdict: ExtractVerdictOutputSchema,
} as const;

export type SectionId = keyof typeof SECTION_SCHEMAS;
/** Sections kept in `drafts`; the gates result has its own state field. */
export type DraftSectionId = Exclude<SectionId, "gates">;
export type SectionOutput<K extends SectionId> = z.infer<
  (typeof SECTION_SCHEMAS)[K]
>;

/**
 * The eight sections that read the pages, in the order they are started: the ones a retry can redo
 * and the guide leads with come first, so a run that runs out of time keeps the most useful ones.
 * The verdict runs after them, because it picks steps and blockers by position.
 */
export const FIRST_WAVE: readonly Exclude<SectionId, "verdict">[] = [
  "steps",
  "scopes",
  "requirements",
  "blockers",
  "milestones",
  "gates",
  "limits",
  "conflicts",
];
