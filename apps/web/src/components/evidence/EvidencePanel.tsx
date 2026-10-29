/**
 * File: EvidencePanel.tsx
 * Purpose: Everything behind one claim: its label and what the label means, the full claim text (so clamped text loses nothing),
 *          each source as a chip with the verbatim quote and when it was read, why there is no source when there is none,
 *          and the Report wrong claim action. Shown in a popover, a bottom sheet, or inline.
 * Exports: EvidencePanel
 * Used by: components/evidence/ClaimEvidence.tsx, components/landing/EvidenceSection.tsx
 */
import type { ReactElement } from "react";
import { EvidenceLabel } from "@/components/shared/EvidenceLabel";
import { SourceChip } from "@/components/shared/SourceChip";
import type { Claim } from "@/types/guide-model";
import { EVIDENCE_META } from "@/utils/evidence";
import { formatRetrieved } from "@/utils/format-date";
import { ReportClaim } from "./ReportClaim";

export function EvidencePanel({ claim }: { claim: Claim }): ReactElement {
  return (
    <div className="flex flex-col gap-4 text-left">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <EvidenceLabel kind={claim.label} />
          <span className="text-small text-ink-muted">{EVIDENCE_META[claim.label].meaning}</span>
        </div>
        <p className="text-body text-ink">{claim.text}</p>
      </div>
      {claim.sources.length === 0 ? (
        <p className="text-small text-ink-muted">{claim.reason ?? "No source found."}</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {claim.sources.map((source) => (
            <li key={source.url} className="flex min-w-0 flex-col gap-2">
              <SourceChip source={source} />
              {source.quote && (
                <blockquote className="border-l-2 border-rule pl-3 text-small text-ink-muted">{source.quote}</blockquote>
              )}
              {source.retrievedAt && <p className="text-small text-ink-muted">{formatRetrieved(source.retrievedAt)}</p>}
            </li>
          ))}
        </ul>
      )}
      <ReportClaim claim={claim} />
    </div>
  );
}
