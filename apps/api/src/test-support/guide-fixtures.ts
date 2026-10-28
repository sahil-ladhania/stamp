/**
 * File: guide-fixtures.ts
 * Purpose: A complete set of drafted sections (all quotes real) for the verify, assemble and save tests, plus draft builders.
 * Exports: DRAFTS, drafted, withDrafts
 * Used by: agent/verify/*.test.ts, agent/guide/*.test.ts, agent/nodes/{verify,save}*.test.ts
 */
import type { Drafts, SectionDraft } from "../agent/state.js";
import type {
  DraftSectionId,
  SectionOutput,
} from "../agent/extract/sections.js";
import {
  BLOCKERS_OUTPUT,
  LIMITS_OUTPUT,
  MILESTONES_OUTPUT,
  REQUIREMENTS_OUTPUT,
  SCOPES_OUTPUT,
  STEPS_OUTPUT,
  VERDICT_OUTPUT,
} from "./extract-replies.js";

export const drafted = <K extends DraftSectionId>(
  payload: SectionOutput<K>,
): SectionDraft<K> => ({
  status: "drafted",
  payload,
});

/** Every section drafted from real quotes on the two fixture pages. */
export const DRAFTS: Drafts = {
  steps: drafted<"steps">(STEPS_OUTPUT),
  scopes: drafted<"scopes">(SCOPES_OUTPUT),
  requirements: drafted<"requirements">(REQUIREMENTS_OUTPUT),
  blockers: drafted<"blockers">(BLOCKERS_OUTPUT),
  milestones: drafted<"milestones">(MILESTONES_OUTPUT),
  limits: drafted<"limits">(LIMITS_OUTPUT),
  conflicts: drafted<"conflicts">({ conflicts: [] }),
  verdict: drafted<"verdict">(VERDICT_OUTPUT),
};

/** DRAFTS with these sections replaced. */
export const withDrafts = (overrides: Drafts): Drafts => ({
  ...DRAFTS,
  ...overrides,
});
