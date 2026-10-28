/**
 * File: ClaimEvidence.tsx
 * Purpose: The evidence for one claim: its label, its source links with their tier, the verbatim quote, and the
 *          control to report it as wrong.
 * Exports: ClaimEvidence
 * Used by: components/guide/* (every claim on a guide)
 */
import type { ReactElement } from "react";
import { EvidenceLabel } from "@/components/shared/EvidenceLabel";
import { SourceLink } from "@/components/shared/SourceLink";
import type { Claim } from "@/types/guide-model";
import { TIER_LABEL } from "@/utils/source-tier";
import { ReportClaim } from "./ReportClaim";
import { SourceQuotes } from "./SourceQuotes";

/**
 * Every claim shows a label and its sources. An unknown fact says what is unknown in its own text, so its reason
 * only appears in the label's hover and focus detail instead of repeating the text.
 */
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
      <SourceQuotes sources={claim.sources} />
      <ReportClaim claim={claim} />
    </div>
  );
}
