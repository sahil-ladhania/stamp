/**
 * File: UnknownValue.tsx
 * Purpose: The value shown when a section was not researched: the word Unknown with an Uncertain label.
 * Exports: UnknownValue
 * Used by: components/guide/NextStepCard.tsx, TopBlockerCard.tsx
 */
import type { ReactElement } from "react";
import { EvidenceLabel } from "@/components/shared/EvidenceLabel";

export function UnknownValue(): ReactElement {
  return (
    <div className="flex flex-col items-start gap-2">
      <p className="text-card-title text-ink">Unknown</p>
      <EvidenceLabel kind="uncertain" detail="Not researched" />
    </div>
  );
}
