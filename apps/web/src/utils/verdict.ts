/**
 * File: verdict.ts
 * Purpose: Turns a guide into the rows shown on the verdict stamp. Pure; no scoring happens here. Each row keeps
 *          the label of the claim it quotes.
 * Exports: VerdictRow, getVerdictRows
 * Used by: components/guide/VerdictStamp.tsx
 */
import type { Claim, EvidenceKind, Guide } from "@/types/guide-model";

export type VerdictRow = {
  label: string;
  value: string;
  kind: EvidenceKind;
  /** Shown on hover and focus of the evidence label. */
  detail?: string;
};

function row(label: string, claim: Claim, value: string = claim.text): VerdictRow {
  return {
    label,
    value,
    kind: claim.label,
    detail: claim.reason ?? claim.sources[0]?.title,
  };
}

/** A section a partial run did not finish: shown as Unknown and Uncertain, never dropped. */
function unknownRow(label: string): VerdictRow {
  return {
    label,
    value: "Unknown",
    kind: "uncertain",
    detail: "Not researched",
  };
}

/** Rows: first test, production, approval wait, top blocker, next step. */
export function getVerdictRows(guide: Guide): VerdictRow[] {
  const [firstTest, production] = guide.milestones;
  const blocker = guide.blockers.find((item) => item.id === guide.topBlockerId);
  const step = guide.steps.find((item) => item.id === guide.nextStepId);
  return [
    row("First test", firstTest.effort),
    row("Production", production.effort),
    row("Approval wait", production.wait),
    blocker
      ? row("Top blocker", blocker.symptom, blocker.title)
      : unknownRow("Top blocker"),
    step ? row("Next step", step.detail, step.title) : unknownRow("Next step"),
  ];
}
