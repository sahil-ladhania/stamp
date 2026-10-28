/**
 * File: ClaimLine.tsx
 * Purpose: A claim as one line of a list: its text in ink (optionally cut on a word with a "More" toggle) and the label of the claim
 *          as a compact trigger. An unknown claim is the muted "Not found" with the Uncertain label, never an empty box.
 * Exports: ClaimLine
 * Used by: components/guide/* (requirements, limits, blockers, timeline, conflicts)
 */
import type { ReactElement } from "react";
import { ClampedText } from "@/components/shared/ClampedText";
import { UnknownValue } from "@/components/shared/UnknownValue";
import { cn } from "@/lib/utils";
import type { Claim } from "@/types/guide-model";
import { isUnknownClaim } from "@/utils/is-unknown-claim";
import { ClaimEvidence } from "./ClaimEvidence";

type ClaimLineProps = {
  claim: Claim;
  /** Cuts the text on a word boundary at this many characters, with a toggle for the rest. */
  max?: number;
  /** What an unknown claim says before its label. */
  unknownText?: string;
  className?: string;
};

export function ClaimLine({ claim, max, unknownText, className }: ClaimLineProps): ReactElement {
  if (isUnknownClaim(claim)) return <UnknownValue text={unknownText} claim={claim} className={className} />;

  return (
    <span className={cn("flex min-w-0 flex-wrap items-start gap-x-3 gap-y-1", className)}>
      {max ? (
        <ClampedText text={claim.text} max={max} className="min-w-0 flex-1 basis-60 text-body text-ink" />
      ) : (
        <span className="min-w-0 flex-1 basis-60 text-body text-ink">{claim.text}</span>
      )}
      <ClaimEvidence claim={claim} />
    </span>
  );
}
