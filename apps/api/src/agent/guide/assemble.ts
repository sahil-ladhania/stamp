/**
 * File: assemble.ts
 * Purpose: Builds the Guide from the drafts, the verified claims, the confirmed conflicts and the score. Gaps become Uncertain unknown claims.
 * Exports: assembleGuide, AssembleInput
 * Used by: agent/nodes/save.ts
 */
import {
  SCHEMA_VERSION,
  type Archetype,
  type Claim,
  type Conflict,
  type DifficultyBreakdown,
  type Guide,
} from "@stamp/schema";
import type { AppIdentity, Drafts } from "../state.js";
import { claimLookup } from "./claim-lookup.js";
import { pickTopBlockerId } from "./top-blocker.js";
import {
  buildBlockers,
  buildLimits,
  buildMilestones,
  buildRequirements,
  buildScopes,
  buildSteps,
  buildVerdict,
} from "./assemble-sections.js";

export type AssembleInput = {
  app: AppIdentity;
  drafts: Drafts;
  claims: readonly Claim[];
  conflicts: readonly Conflict[];
  difficulty: DifficultyBreakdown;
  archetype: Archetype;
  /** True when the budget stopped the run, or a stage did not finish. */
  partial: boolean;
  asOf: Date;
};

/** Every claim in the guide is one verify produced or an unknown claim; nothing the model wrote reaches it unchecked. */
export function assembleGuide(input: AssembleInput): Guide {
  const { app, drafts } = input;
  const resolve = claimLookup(input.claims);
  const steps = buildSteps(drafts, resolve);
  const blockers = buildBlockers(drafts, resolve);
  return {
    schemaVersion: SCHEMA_VERSION,
    slug: app.slug,
    appName: app.appName,
    domain: app.domain,
    mode: "live",
    archetype: input.archetype,
    difficulty: input.difficulty.score,
    asOf: input.asOf.toISOString(),
    coverage: input.partial ? "partial" : "full",
    verdict: buildVerdict(drafts, resolve, {
      steps: steps.length,
      topBlockerId: pickTopBlockerId(blockers),
    }),
    milestones: buildMilestones(drafts, resolve),
    requirements: buildRequirements(drafts, resolve),
    scopes: buildScopes(drafts, resolve),
    steps,
    blockers,
    limits: buildLimits(drafts, resolve),
    conflicts: [...input.conflicts],
    difficultyBreakdown: input.difficulty,
  };
}
