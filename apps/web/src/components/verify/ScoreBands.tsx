/**
 * File: ScoreBands.tsx
 * Purpose: How total points map to the 1 to 5 score, with the example's band marked.
 * Exports: ScoreBands
 * Used by: components/verify/DifficultySection.tsx
 */
import type { ReactElement } from "react";
import { DifficultyDots } from "@/components/shared/DifficultyDots";
import { cn } from "@/lib/utils";
import { SCORE_BANDS } from "@/content/difficulty-rule";

type ScoreBandsProps = { total: number; exampleName: string };

export function ScoreBands({
  total,
  exampleName,
}: ScoreBandsProps): ReactElement {
  return (
    <ul className="grid grid-cols-2 gap-3 tablet:grid-cols-5">
      {SCORE_BANDS.map((band) => {
        const isChosen = total >= band.min && total <= band.max;
        return (
          <li
            key={band.score}
            className={cn(
              "flex flex-col gap-2 rounded-md border p-3",
              isChosen ? "border-ink bg-card" : "border-rule",
            )}
          >
            <span className="text-data text-ink-muted">
              {band.range} points
            </span>
            <DifficultyDots score={band.score} hasValue />
            {isChosen && (
              <span className="text-data text-ink">{exampleName}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
