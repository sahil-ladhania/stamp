/**
 * File: VerificationBar.tsx
 * Purpose: How many claims in this guide carry each evidence label, counted from the guide itself, as one stacked bar in the label
 *          colours with the numbers beside it. The numbers say the same thing, so the bar is never the only signal.
 * Exports: VerificationBar
 * Used by: components/guide/SourcesSection.tsx
 */
import type { ReactElement } from "react";
import { EvidenceLabel } from "@/components/shared/EvidenceLabel";
import { TextLink } from "@/components/shared/TextLink";
import type { EvidenceKind, Guide } from "@/types/guide-model";
import { countByLabel } from "@/utils/claims";
import { confirmedSummary } from "@/utils/confirmed-summary";
import { EVIDENCE_KINDS, EVIDENCE_META } from "@/utils/evidence";

const BAR_FILL: Record<EvidenceKind, string> = { tested: "bg-tested", sourced: "bg-sourced", uncertain: "bg-uncertain" };

export function VerificationBar({ guide }: { guide: Guide }): ReactElement {
  const counts = countByLabel(guide.claims);
  const total = guide.claims.length;
  const description = EVIDENCE_KINDS.map((kind) => `${counts[kind]} ${EVIDENCE_META[kind].word}`).join(", ");

  return (
    <div className="flex flex-col gap-4 rounded-md border border-rule bg-card p-card">
      <p className="text-card-title text-ink">{confirmedSummary(guide.claims).text}</p>
      <div role="img" aria-label={`Claims by label: ${description}`} className="flex h-3 w-full overflow-hidden rounded-full bg-rule">
        {EVIDENCE_KINDS.filter((kind) => counts[kind] > 0).map((kind) => (
          <span key={kind} className={BAR_FILL[kind]} style={{ width: `${(counts[kind] / total) * 100}%` }} />
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
      <p className="text-body text-ink-muted">Every claim has a label. Uncertain claims say why.</p>
      <TextLink to="/how-we-verify">Read how we verify</TextLink>
    </div>
  );
}
