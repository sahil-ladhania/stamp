/**
 * File: verdict.ts
 * Purpose: Turns a guide into the rows shown on the verdict stamp. Pure; no scoring happens here.
 * Exports: VerdictRow, getVerdictRows
 * Used by: components/guide/VerdictStamp.tsx
 */
import type { Claim, EvidenceKind, Guide } from "@/mocks/types";

export type VerdictRow = {
  label: string;
  value: string;
  kind: EvidenceKind;
  /** Shown on hover and focus of the evidence label. */
  detail?: string;
};

function row(label: string, value: string, claim?: Claim): VerdictRow {
  return {
    label,
    value,
    kind: claim?.label ?? "uncertain",
    detail: claim?.reason ?? claim?.sources[0]?.title,
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

/**
 * A milestone's first claim is its headline claim and its last is its wait claim.
 * Rows: first test, production, approval wait, top blocker, next step.
 */
export function getVerdictRows(guide: Guide): VerdictRow[] {
  const [firstTest, production] = guide.milestones;
  const blocker = guide.blockers.find((item) => item.id === guide.topBlockerId);
  const step = guide.steps.find((item) => item.id === guide.nextStepId);

  return [
    row("First test", firstTest.duration, firstTest.claims[0]),
    row("Production", production.wait, production.claims[0]),
    row("Approval wait", production.duration, production.claims.at(-1)),
    blocker
      ? row("Top blocker", blocker.title, blocker.claim)
      : unknownRow("Top blocker"),
    step ? row("Next step", step.title, step.claim) : unknownRow("Next step"),
  ];
}
