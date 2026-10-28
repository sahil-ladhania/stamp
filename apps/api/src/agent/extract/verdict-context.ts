/**
 * File: verdict-context.ts
 * Purpose: Builds the numbered lists of steps and blockers the verdict call picks from, and their lengths.
 * Exports: verdictContext
 * Used by: agent/nodes/extract.ts
 */
import type { Drafts } from "../state.js";

export type VerdictContext = {
  context: string;
  stepCount: number;
  blockerCount: number;
};

/** Steps (by title) and blockers (by symptom) as lists counted from 0, the positions the verdict answers with. */
export function verdictContext(drafts: Drafts): VerdictContext {
  const steps =
    drafts.steps?.status === "drafted"
      ? drafts.steps.payload.steps.map((step) => step.title)
      : [];
  const blockers =
    drafts.blockers?.status === "drafted"
      ? drafts.blockers.payload.blockers.map((blocker) => blocker.symptom.text)
      : [];
  const list = (title: string, items: string[]): string =>
    items.length === 0
      ? `${title}: none found`
      : [`${title}:`, ...items.map((item, i) => `${i}. ${item}`)].join("\n");
  return {
    context: [list("Steps", steps), list("Blockers", blockers)].join("\n\n"),
    stepCount: steps.length,
    blockerCount: blockers.length,
  };
}
