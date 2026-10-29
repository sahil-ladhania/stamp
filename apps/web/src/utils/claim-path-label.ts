/**
 * File: claim-path-label.ts
 * Purpose: Turns a claim id (the path code gives every claim in a guide, such as `blockers.0.fix`) into words a visitor reads:
 *          "Blocker 1, Fix". The ids come from a fixed set (apps/api agent/guide/claim-slots.ts); an id outside it reads "Claim".
 * Exports: claimPathLabel
 * Used by: components/run/QuoteRow.tsx
 */

const PART_LABEL: Record<string, string> = {
  detail: "Detail",
  effort: "Effort",
  symptom: "Symptom",
  cause: "Cause",
  fix: "Fix",
  contact: "Contact",
  reason: "Reason",
};

const MILESTONE_LABEL: Record<string, string> = {
  "milestones.firstTest.effort": "First test, Time",
  "milestones.firstTest.wait": "First test, Waits on",
  "milestones.production.effort": "Production, Time",
  "milestones.production.wait": "Approval wait",
};

const LIST_LABEL: Record<string, string> = {
  requirements: "Requirement",
  scopes: "Scope",
  steps: "Step",
  blockers: "Blocker",
  limits: "Limit",
  conflicts: "Conflict",
};

export function claimPathLabel(claimId: string): string {
  if (claimId === "verdict.summary") return "Headline";
  const milestone = MILESTONE_LABEL[claimId];
  if (milestone) return milestone;

  const [section = "", index = "", part] = claimId.split(".");
  const noun = LIST_LABEL[section];
  const position = Number(index);
  if (!noun || index === "" || !Number.isInteger(position) || position < 0) return "Claim";

  const name = `${noun} ${position + 1}`;
  const partLabel = part ? PART_LABEL[part] : undefined;
  if (part && !partLabel) return "Claim";
  // A scope or conflict has one claim, its reason, so the name alone says it.
  return partLabel && part !== "reason" ? `${name}, ${partLabel}` : name;
}
