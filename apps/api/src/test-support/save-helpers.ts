/**
 * File: save-helpers.ts
 * Purpose: A run state ready for the save stage (drafts, verified claims, score, checks, stages done), for the save node tests.
 * Exports: readyState, STAGES_BEFORE_SAVE, savedGuide
 * Used by: agent/nodes/save*.test.ts
 */
import { GuideSchema, type Guide } from "@stamp/schema";
import { scoreDifficulty } from "../agent/scoring/difficulty.js";
import { UNKNOWN_FACTS } from "../agent/scoring/gate-facts.js";
import { verifyClaims } from "../agent/verify/verify-claims.js";
import { claimSlots } from "../agent/guide/claim-slots.js";
import type { State } from "../agent/state.js";
import { PAGES, PAGE_INDEX } from "./extract-fixtures.js";
import { DRAFTS } from "./guide-fixtures.js";
import { makeState } from "./graph-harness.js";
import { APP } from "./node-fixtures.js";

export const STAGES_BEFORE_SAVE = [0, 1, 2, 3, 4, 5, 6, 7] as const;

/** The state the save stage sees after a complete run, with these fields changed. */
export function readyState(over: Partial<State> = {}): State {
  const verified = verifyClaims(claimSlots(DRAFTS), PAGE_INDEX, new Set());
  return makeState({
    app: APP,
    pages: PAGES,
    drafts: DRAFTS,
    claims: verified.claims,
    checks: verified.checks,
    difficulty: scoreDifficulty(UNKNOWN_FACTS),
    archetype: "unknown",
    completed: [...STAGES_BEFORE_SAVE],
    ...over,
  });
}

/** Parses the guide a node returned, failing the test if it is missing or invalid. */
export function savedGuide(update: { guide?: unknown }): Guide {
  return GuideSchema.parse(update.guide);
}
