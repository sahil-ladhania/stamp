/**
 * File: ClaimEvidence.tsx
 * Purpose: The evidence for one claim: its label, its source links with their tier, and the reason if Uncertain.
 * Exports: ClaimEvidence
 * Used by: components/guide/ConflictCard.tsx, StepCard.tsx, BlockerCard.tsx, MilestoneBar.tsx, NextStepCard.tsx
 */
import type { ReactElement } from "react";
import { EvidenceLabel } from "@/components/shared/EvidenceLabel";
import { SourceLink } from "@/components/shared/SourceLink";
import type { Claim } from "@/mocks/types";
import { TIER_LABEL } from "@/utils/source-tier";

/** Every claim shows a label and either a source or a reason, so nothing is bare. */
export function ClaimEvidence({ claim }: { claim: Claim }): ReactElement {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <EvidenceLabel
          kind={claim.label}
          detail={claim.sources[0]?.title ?? claim.reason}
        />
        {claim.sources.map((source) => (
          <span key={source.url} className="flex flex-wrap items-center gap-2">
            <SourceLink source={source} />
            <span className="text-data text-ink-muted">
              {TIER_LABEL[source.tier]}
            </span>
          </span>
        ))}
      </div>
      {claim.reason && (
        <p className="text-small text-ink-muted">{claim.reason}</p>
      )}
    </div>
  );
}
