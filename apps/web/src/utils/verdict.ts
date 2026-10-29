/**
 * File: verdict.ts
 * Purpose: Turns a guide into the claim rows of the verdict: first test, production, approval wait, top blocker and next step.
 *          Pure; no scoring happens here. Each row keeps the claim it quotes, so its label travels with it. The difficulty
 *          and the kind of hard are not claims (code sets them), so the verdict shows them on their own.
 * Exports: VerdictRowId, VerdictSection, VerdictRow, getVerdictRows
 * Used by: components/verdict/Verdict.tsx, components/landing/VerdictSection.tsx
 */
import type { Claim, Guide } from "@/types/guide-model";

export type VerdictRowId =
  | "difficulty"
  | "kind"
  | "firstTest"
  | "production"
  | "approvalWait"
  | "topBlocker"
  | "nextStep";

/** The element id of the section that holds the full version of a row. */
export type VerdictSection = "timeline" | "steps" | "blockers";

export type VerdictRow = {
  id: Exclude<VerdictRowId, "difficulty" | "kind">;
  label: string;
  section: VerdictSection;
  /** The short value, in the claim's own words. */
  value: string;
  /** The claim behind the value. Null when a partial run did not get to this part. */
  claim: Claim | null;
};

/** Rows: first test, production, approval wait, top blocker, next step. */
export function getVerdictRows(guide: Guide): VerdictRow[] {
  const [firstTest, production] = guide.milestones;
  const blocker = guide.blockers.find((item) => item.id === guide.topBlockerId);
  const step = guide.steps.find((item) => item.id === guide.nextStepId);
  return [
    { id: "firstTest", label: "First test", section: "timeline", value: firstTest.effort.text, claim: firstTest.effort },
    { id: "production", label: "Production", section: "timeline", value: production.effort.text, claim: production.effort },
    { id: "approvalWait", label: "Approval wait", section: "timeline", value: production.wait.text, claim: production.wait },
    {
      id: "topBlocker",
      label: "Top blocker",
      section: "blockers",
      value: blocker?.title ?? "",
      claim: blocker?.symptom ?? null,
    },
    {
      id: "nextStep",
      label: "Next step",
      section: "steps",
      value: step?.title ?? "",
      claim: step?.detail ?? null,
    },
  ];
}
