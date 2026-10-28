/**
 * File: claim-slots.ts
 * Purpose: The stable id of every claim slot in a guide, and the list of slots the drafts fill (with which are time estimates).
 * Exports: slotId, claimSlots, ClaimSlot, ClaimKind
 * Used by: agent/verify/*, agent/guide/assemble-sections.ts, agent/guide/claim-lookup.ts
 */
import type { DraftClaim } from "../draft-claim.js";
import type { Drafts } from "../state.js";

/** A time estimate (effort or wait) stays Uncertain until tested; anything else can become Sourced. */
export type ClaimKind = "fact" | "estimate";
export type ClaimSlot = { id: string; draft: DraftClaim; kind: ClaimKind };

type Milestone = "firstTest" | "production";
type Part = "effort" | "wait";

/** Ids are assigned once, here, so the events, the verification log and the final guide always agree. */
export const slotId = {
  verdictSummary: "verdict.summary",
  milestone: (milestone: Milestone, part: Part) =>
    `milestones.${milestone}.${part}`,
  requirement: (i: number) => `requirements.${i}`,
  scope: (i: number) => `scopes.${i}`,
  scopeReason: (i: number) => `scopes.${i}.reason`,
  step: (i: number) => `steps.${i}`,
  stepPart: (i: number, part: "detail" | "effort") => `steps.${i}.${part}`,
  blocker: (i: number) => `blockers.${i}`,
  blockerPart: (i: number, part: "symptom" | "cause" | "fix" | "contact") =>
    `blockers.${i}.${part}`,
  limit: (i: number) => `limits.${i}`,
  conflict: (i: number) => `conflicts.${i}`,
  conflictReason: (i: number) => `conflicts.${i}.reason`,
} as const;

/** Every claim the drafted sections contain, in guide order; a section that is not drafted, or a null claim, has none. */
export function claimSlots(drafts: Drafts): ClaimSlot[] {
  const slots: ClaimSlot[] = [];
  const add = (
    id: string,
    draft: DraftClaim | null,
    kind: ClaimKind = "fact",
  ): void => {
    if (draft !== null) slots.push({ id, draft, kind });
  };

  if (drafts.verdict?.status === "drafted") {
    add(slotId.verdictSummary, drafts.verdict.payload.summary);
  }
  if (drafts.milestones?.status === "drafted") {
    const m = drafts.milestones.payload;
    add(slotId.milestone("firstTest", "effort"), m.firstTestEffort, "estimate");
    add(slotId.milestone("firstTest", "wait"), m.firstTestWait, "estimate");
    add(
      slotId.milestone("production", "effort"),
      m.productionEffort,
      "estimate",
    );
    add(slotId.milestone("production", "wait"), m.productionWait, "estimate");
  }
  if (drafts.requirements?.status === "drafted") {
    drafts.requirements.payload.requirements.forEach((c, i) =>
      add(slotId.requirement(i), c),
    );
  }
  if (drafts.scopes?.status === "drafted") {
    drafts.scopes.payload.scopes.forEach((s, i) =>
      add(slotId.scopeReason(i), s.reason),
    );
  }
  if (drafts.steps?.status === "drafted") {
    drafts.steps.payload.steps.forEach((s, i) => {
      add(slotId.stepPart(i, "detail"), s.detail);
      add(slotId.stepPart(i, "effort"), s.effort, "estimate");
    });
  }
  if (drafts.blockers?.status === "drafted") {
    drafts.blockers.payload.blockers.forEach((b, i) => {
      add(slotId.blockerPart(i, "symptom"), b.symptom);
      add(slotId.blockerPart(i, "cause"), b.cause);
      add(slotId.blockerPart(i, "fix"), b.fix);
      add(slotId.blockerPart(i, "contact"), b.contact);
    });
  }
  if (drafts.limits?.status === "drafted") {
    drafts.limits.payload.limits.forEach((c, i) => add(slotId.limit(i), c));
  }
  return slots;
}
