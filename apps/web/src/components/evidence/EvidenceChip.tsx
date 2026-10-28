/**
 * File: EvidenceChip.tsx
 * Purpose: A value with its label, as one trigger for a claim's evidence: for example a duration chip ("1 to 4 weeks") with a
 *          compact label beside it. Used where the value itself is the claim.
 * Exports: EvidenceChip
 * Used by: components/evidence/ClaimEvidence.tsx
 */
import type { ComponentProps, ReactElement, ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Claim } from "@/types/guide-model";
import { EVIDENCE_META, evidencePillClass } from "@/utils/evidence";

type EvidenceChipProps = Omit<ComponentProps<"button">, "children"> & {
  claim: Claim;
  children: ReactNode;
};

export function EvidenceChip({ claim, children, className, ...props }: EvidenceChipProps): ReactElement {
  const { word, icon: Icon, className: tone } = EVIDENCE_META[claim.label];

  return (
    <button
      type="button"
      aria-label={`${children}. ${word}. Show evidence`}
      className={cn(
        "inline-flex cursor-pointer items-center gap-2 rounded-md border border-rule bg-card py-0.5 pr-1 pl-2 text-data text-ink transition-colors hover:border-ink-muted",
        className,
      )}
      {...props}
    >
      <span>{children}</span>
      <span className={cn(evidencePillClass("sm"), tone)}>
        <Icon aria-hidden className="size-3" />
        {word}
      </span>
    </button>
  );
}
