/**
 * File: DifficultyRow.tsx
 * Purpose: The difficulty row of the verdict: the five dots, the score, and "Why this score". The score is set by code from a
 *          fixed rule, so it has no evidence label; its reasons are one step away.
 * Exports: DifficultyRow
 * Used by: components/verdict/Verdict.tsx
 */
import type { ReactElement } from "react";
import { DifficultyDots } from "@/components/shared/DifficultyDots";
import type { Difficulty } from "@/types/guide-model";
import { DifficultyPopover } from "./DifficultyPopover";
import { VerdictRowFrame } from "./VerdictRow";

type DifficultyRowProps = { difficulty: Difficulty; isHighlighted: boolean; isRated?: boolean }

export function DifficultyRow({ difficulty, isHighlighted, isRated = true }: DifficultyRowProps): ReactElement {
  return (
    <VerdictRowFrame id="verdict-difficulty" label="Difficulty" href={null} linkLabel="" isHighlighted={isHighlighted}>
      <DifficultyDots score={difficulty.score} hasValue isRated={isRated} />
      <DifficultyPopover difficulty={difficulty} isRated={isRated} />
    </VerdictRowFrame>
  );
}
