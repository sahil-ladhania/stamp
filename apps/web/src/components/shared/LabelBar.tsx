/**
 * File: LabelBar.tsx
 * Purpose: How many claims carry each evidence label, as one stacked bar in the label colours with the numbers beside it. The numbers
 *          say the same thing, so the bar is never the only signal.
 * Exports: LabelBar
 * Used by: components/guide/VerificationBar.tsx, components/run/RunResultCard.tsx
 */
import type { ReactElement } from "react";
import type { Claim, EvidenceKind } from "@/types/guide-model";
import { countByLabel } from "@/utils/claims";
import { EVIDENCE_KINDS, EVIDENCE_META } from "@/utils/evidence";
import { EvidenceLabel } from "./EvidenceLabel";

const BAR_FILL: Record<EvidenceKind, string> = { tested: "bg-tested", sourced: "bg-sourced", uncertain: "bg-uncertain" };

export function LabelBar({ claims }: { claims: readonly Claim[] }): ReactElement {
  const counts = countByLabel(claims);
  const description = EVIDENCE_KINDS.map((kind) => `${counts[kind]} ${EVIDENCE_META[kind].word}`).join(", ");

  return (
    <div className="flex flex-col gap-3">
      <div role="img" aria-label={`Claims by label: ${description}`} className="flex h-3 w-full overflow-hidden rounded-full bg-rule">
        {EVIDENCE_KINDS.filter((kind) => counts[kind] > 0).map((kind) => (
          <span key={kind} className={BAR_FILL[kind]} style={{ width: `${(counts[kind] / claims.length) * 100}%` }} />
        ))}
      </div>
      <ul className="flex flex-col gap-2">
        {EVIDENCE_KINDS.map((kind) => (
          <li key={kind} className="flex items-center justify-between gap-3">
            <EvidenceLabel kind={kind} size="sm" />
            <span className="font-mono text-data text-ink">{counts[kind]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
