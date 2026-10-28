/**
 * File: ClaimEvidence.tsx
 * Purpose: The one way a claim shows its evidence: a compact trigger (the label with its source count, or a value with its
 *          label) that opens the evidence panel. A popover on a wide screen, a bottom sheet on a phone. Every claim on every
 *          page uses it, so a label is never hidden and the sources, quote and Report are always one step away.
 * Exports: ClaimEvidence
 * Used by: every component that shows a claim
 */
import type { ReactElement, ReactNode } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { Claim } from "@/types/guide-model";
import { excerpt } from "@/utils/excerpt";
import { EvidenceBadge } from "./EvidenceBadge";
import { EvidenceChip } from "./EvidenceChip";
import { EvidencePanel } from "./EvidencePanel";

type ClaimEvidenceProps = {
  claim: Claim;
  /** `badge` is the label with its count. `chip` wraps a value (the children) together with its label. */
  variant?: "badge" | "chip";
  children?: ReactNode;
  className?: string;
};

const PHONE = "(max-width: 47.9375rem)";

export function ClaimEvidence({ claim, variant = "badge", children, className }: ClaimEvidenceProps): ReactElement {
  const isPhone = useMediaQuery(PHONE);
  const trigger =
    variant === "chip" ? (
      <EvidenceChip claim={claim} className={className}>
        {children}
      </EvidenceChip>
    ) : (
      <EvidenceBadge kind={claim.label} count={claim.sources.length} className={className} />
    );

  if (isPhone) {
    return (
      <Sheet>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent title={`Evidence: ${excerpt(claim.text)}`}>
          <EvidencePanel claim={claim} />
        </SheetContent>
      </Sheet>
    );
  }
  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent>
        <EvidencePanel claim={claim} />
      </PopoverContent>
    </Popover>
  );
}
