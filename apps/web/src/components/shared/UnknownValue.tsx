/**
 * File: UnknownValue.tsx
 * Purpose: How an unknown value reads everywhere: a muted inline "Not found" and the Uncertain label. With a claim, the label is
 *          the trigger of its evidence, which carries the full reason. It is inline, so it never makes an empty card.
 * Exports: UnknownValue
 * Used by: verdict rows, timeline, steps, tables, lists
 */
import type { ReactElement } from "react";
import { ClaimEvidence } from "@/components/evidence/ClaimEvidence";
import { EvidenceLabel } from "@/components/shared/EvidenceLabel";
import { cn } from "@/lib/utils";
import type { Claim } from "@/types/guide-model";

type UnknownValueProps = {
  /** The words before the label. "Not found" when the research found nothing; other copy for a value with no text. */
  text?: string;
  /** The unknown claim, when there is one. Without it the label is static. */
  claim?: Claim;
  /** False leaves the label off, for a value that is not a claim (for example a duration the text does not state). */
  hasBadge?: boolean;
  className?: string;
};

export function UnknownValue({ text = "Not found", claim, hasBadge = true, className }: UnknownValueProps): ReactElement {
  return (
    <span className={cn("inline-flex flex-wrap items-center gap-2 text-body text-ink-muted", className)}>
      <span>{text}</span>
      {claim ? <ClaimEvidence claim={claim} /> : hasBadge && <EvidenceLabel kind="uncertain" size="sm" />}
    </span>
  );
}
