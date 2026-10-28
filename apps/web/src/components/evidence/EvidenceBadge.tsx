/**
 * File: EvidenceBadge.tsx
 * Purpose: The trigger of a claim's evidence: the label as a button, with the source count ("Sourced · 1"). It carries the icon,
 *          the word and the colour, so the label is always visible; the sources, quote and Report open from it.
 * Exports: EvidenceBadge
 * Used by: components/evidence/ClaimEvidence.tsx
 */
import type { ComponentProps, ReactElement } from "react";
import { cn } from "@/lib/utils";
import type { EvidenceKind } from "@/types/guide-model";
import { EVIDENCE_META, evidencePillClass, type EvidenceSize } from "@/utils/evidence";
import { excerpt } from "@/utils/excerpt";

type EvidenceBadgeProps = Omit<ComponentProps<"button">, "children"> & {
  kind: EvidenceKind;
  count?: number;
  size?: EvidenceSize;
  /** The claim's text. Many badges share a page, so the accessible name carries the start of it. */
  claimText?: string;
};

/** Spreads its props onto the button, so a Radix trigger can attach to it with `asChild`. */
export function EvidenceBadge({ kind, count, size = "md", claimText, className, ...props }: EvidenceBadgeProps): ReactElement {
  const { word, icon: Icon, className: tone } = EVIDENCE_META[kind];
  const sourcesText = count ? `, ${count} ${count === 1 ? "source" : "sources"}` : "";

  return (
    <button
      type="button"
      aria-label={`${word}${sourcesText}. Show evidence${claimText ? ` for: ${excerpt(claimText)}` : ""}`}
      className={cn(evidencePillClass(size), tone, "cursor-pointer transition-colors hover:border-current", className)}
      {...props}
    >
      <Icon aria-hidden className={size === "sm" ? "size-3" : "size-3.5"} />
      <span>{word}</span>
      {count ? <span aria-hidden>· {count}</span> : null}
    </button>
  );
}
