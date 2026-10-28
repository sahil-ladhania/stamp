/**
 * File: assemble-helpers.ts
 * Purpose: Builds a full AssembleInput from drafts by running the real claim check, for the assemble and save tests.
 * Exports: assembleInput, verifiedClaims, build, allClaims
 * Used by: agent/guide/assemble*.test.ts, agent/nodes/save*.test.ts
 */
import type { Claim } from "@stamp/schema";
import { assembleGuide, type AssembleInput } from "../agent/guide/assemble.js";
import { claimSlots } from "../agent/guide/claim-slots.js";
import { scoreDifficulty } from "../agent/scoring/difficulty.js";
import { UNKNOWN_FACTS } from "../agent/scoring/gate-facts.js";
import type { Drafts } from "../agent/state.js";
import { verifyClaims } from "../agent/verify/verify-claims.js";
import { PAGE_INDEX } from "./extract-fixtures.js";
import { DRAFTS } from "./guide-fixtures.js";
import { APP } from "./node-fixtures.js";

/** What verify would produce for these drafts, with no conflicts. */
export const verifiedClaims = (drafts: Drafts = DRAFTS): Claim[] =>
  verifyClaims(claimSlots(drafts), PAGE_INDEX, new Set()).claims;

export function assembleInput(
  over: Partial<AssembleInput> = {},
): AssembleInput {
  const drafts = over.drafts ?? DRAFTS;
  return {
    app: APP,
    drafts,
    claims: verifiedClaims(drafts),
    conflicts: [],
    difficulty: scoreDifficulty(UNKNOWN_FACTS),
    archetype: "unknown",
    partial: false,
    asOf: new Date("2026-03-05T10:00:00.000Z"),
    ...over,
  };
}

/** The guide assembled from these changes to the standard input. */
export const build = (over: Partial<AssembleInput> = {}) =>
  assembleGuide(assembleInput(over));

/** Every claim in a guide, in guide order. */
export const allClaims = (guide: ReturnType<typeof build>): Claim[] => [
  guide.verdict.summary,
  ...Object.values(guide.milestones).flatMap((m) => [m.effort, m.wait]),
  ...guide.requirements,
  ...guide.scopes.map((s) => s.reason),
  ...guide.steps.flatMap((s) => [s.detail, s.effort]),
  ...guide.blockers.flatMap((b) => [
    b.symptom,
    b.cause,
    b.fix,
    ...(b.contact ? [b.contact] : []),
  ]),
  ...guide.limits,
];
