/**
 * File: KindRow.tsx
 * Purpose: The "kind of hard" row of the verdict: the name of the kind and what it means. Hidden when the kind is unknown, since
 *          "Unknown" tells a new reader nothing. The kind is set by code, so it has no evidence label.
 * Exports: KindRow
 * Used by: components/verdict/Verdict.tsx
 */
import type { Archetype } from "@stamp/schema";
import type { ReactElement } from "react";
import { ARCHETYPE_BLURB, ARCHETYPE_LABEL } from "@/utils/archetype";
import { VerdictRowFrame } from "./VerdictRow";

export function KindRow({ archetype, isHighlighted }: { archetype: Archetype; isHighlighted: boolean }): ReactElement | null {
  if (archetype === "unknown") return null;
  return (
    <VerdictRowFrame id="verdict-kind" label="Kind of hard" href={null} linkLabel="" isHighlighted={isHighlighted}>
      <span className="text-body font-semibold text-ink">{ARCHETYPE_LABEL[archetype]}</span>
      <span className="min-w-0 flex-1 basis-48 text-body text-ink-muted">{ARCHETYPE_BLURB[archetype]}</span>
    </VerdictRowFrame>
  );
}
