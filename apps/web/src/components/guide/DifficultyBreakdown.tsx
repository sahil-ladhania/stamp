/**
 * File: DifficultyBreakdown.tsx
 * Purpose: The difficulty dots with a "Why this score" disclosure: each factor, its points and the rule's words for them.
 * Exports: DifficultyBreakdown
 * Used by: components/guide/GuideHeader.tsx
 */
import type { ReactElement } from "react";
import { Link } from "react-router";
import { ChevronDown } from "lucide-react";
import { DifficultyDots } from "@/components/shared/DifficultyDots";
import type { Difficulty } from "@/types/guide-model";

/** A native `details`, so the keyboard and screen readers work without extra code. */
export function DifficultyBreakdown({
  difficulty,
}: {
  difficulty: Difficulty;
}): ReactElement {
  return (
    <details className="group rounded-md border border-rule bg-card">
      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 p-3 [&::-webkit-details-marker]:hidden">
        <DifficultyDots score={difficulty.score} hasValue />
        <span className="flex items-center gap-1 text-small text-ink underline underline-offset-4">
          Why this score
          <ChevronDown aria-hidden className="size-4 group-open:rotate-180" />
        </span>
      </summary>
      <div className="flex flex-col gap-3 border-t border-rule p-4">
        <ul className="flex flex-col divide-y divide-rule">
          {difficulty.factors.map((factor) => (
            <li
              key={factor.name}
              className="grid gap-1 py-2 tablet:grid-cols-[9rem_4.5rem_1fr] tablet:gap-3"
            >
              <span className="text-body font-semibold text-ink">
                {factor.name}
              </span>
              <span className="text-data text-ink">
                {factor.points} of {factor.max}
              </span>
              <span className="text-body text-ink-muted">{factor.reason}</span>
            </li>
          ))}
        </ul>
        <p className="text-body text-ink">
          {`${difficulty.total} points, so the score is ${difficulty.score} of 5.`}
        </p>
        <Link
          to="/how-we-verify#difficulty"
          className="self-start text-body text-sourced underline underline-offset-4"
        >
          Read how difficulty is scored
        </Link>
      </div>
    </details>
  );
}
