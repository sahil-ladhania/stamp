/**
 * File: KindRow.tsx
 * Purpose: The "kind of hard" row of the verdict: the name of the kind and what it means. Hidden when the kind is unknown, since "Unknown"
 *          tells a new reader nothing, unless the row carries "Why this score" (the Guide page, where the stamp mark holds the score), where
 *          it says "Not classified". The kind is set by code, so it has no evidence label.
 * Exports: KindRow
 * Used by: components/verdict/Verdict.tsx
 */
import type { Archetype } from "@stamp/schema";
import type { ReactElement } from "react";
import { UnknownValue } from "@/components/shared/UnknownValue";
import type { Difficulty } from "@/types/guide-model";
import { ARCHETYPE_BLURB, ARCHETYPE_LABEL } from "@/utils/archetype";
import { DifficultyPopover } from "./DifficultyPopover";
import { VerdictRowFrame } from "./VerdictRow";

type KindRowProps = {
  archetype: Archetype;
  /** When set, the row ends with "Why this score". */
  difficulty?: Difficulty;
  isHighlighted: boolean;
};

export function KindRow({ archetype, difficulty, isHighlighted }: KindRowProps): ReactElement | null {
  const isKnown = archetype !== "unknown";
  if (!isKnown && !difficulty) return null;

  return (
    <VerdictRowFrame id="verdict-kind" label="Kind of hard" href={null} linkLabel="" isHighlighted={isHighlighted}>
      {isKnown ? (
        <>
          <span className="text-body font-semibold text-ink">{ARCHETYPE_LABEL[archetype]}</span>
          <span className="min-w-0 flex-1 basis-48 text-body text-ink-muted">{ARCHETYPE_BLURB[archetype]}</span>
        </>
      ) : (
        <UnknownValue text="Not classified" hasBadge={false} className="min-w-0 flex-1 basis-48" />
      )}
      {difficulty && <DifficultyPopover difficulty={difficulty} />}
    </VerdictRowFrame>
  );
}
