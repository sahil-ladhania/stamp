/**
 * File: build-guide.ts
 * Purpose: Turns the final graph state into a checked Guide, or says why it cannot: the part of stage 8 that has no side effects.
 * Exports: buildGuide, BuildGuideResult
 * Used by: agent/nodes/save.ts, evals/lib/capture-save-node.ts
 */
import { GuideSchema, type Guide } from "@stamp/schema";
import { isPartial } from "../pipeline.js";
import type { State } from "../state.js";
import { assembleGuide } from "./assemble.js";

export type BuildGuideResult =
  { ok: true; guide: Guide } | { ok: false; reason: string };

/**
 * Fails when the app or score is missing, when no claim is Sourced or Tested (a guide made only of guesses
 * and unknowns is worse than none), or when the guide does not pass GuideSchema. A reason names paths only,
 * because a schema issue message can echo model text.
 */
export function buildGuide(state: State, asOf: Date): BuildGuideResult {
  const { app, difficulty, archetype } = state;
  if (!app || !difficulty || !archetype) {
    return { ok: false, reason: "missing app or score" };
  }
  if (!state.claims.some((claim) => claim.label !== "uncertain")) {
    return { ok: false, reason: "no sourced claim" };
  }
  const parsed = GuideSchema.safeParse(
    assembleGuide({
      app,
      drafts: state.drafts,
      claims: state.claims,
      conflicts: state.conflicts,
      difficulty,
      archetype,
      partial: isPartial(state),
      asOf,
    }),
  );
  if (!parsed.success) {
    const paths = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    return { ok: false, reason: `invalid guide at ${paths}` };
  }
  return { ok: true, guide: parsed.data };
}
