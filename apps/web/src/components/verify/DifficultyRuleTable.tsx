/**
 * File: DifficultyRuleTable.tsx
 * Purpose: The difficulty rule as a table of points per factor, with one app's points marked as the example.
 * Exports: DifficultyRuleTable
 * Used by: components/verify/DifficultySection.tsx
 */
import type { ReactElement } from "react";
import { cn } from "@/lib/utils";
import { DIFFICULTY_FACTORS, POINT_COLUMNS } from "@/content/difficulty-rule";
import type { Difficulty } from "@/types/guide-model";

type DifficultyRuleTableProps = {
  example: Difficulty;
  exampleName: string;
};

/**
 * Wide on purpose: a 2D rule cannot fold into one column, so on phones the region scrolls sideways.
 * The region is focusable so keyboard users can scroll it. It is `relative` so the absolutely
 * positioned `sr-only` header text is clipped with it instead of widening the whole page.
 */
export function DifficultyRuleTable({
  example,
  exampleName,
}: DifficultyRuleTableProps): ReactElement {
  const chosen = new Map(example.factors.map((f) => [f.name, f.points]));

  return (
    <div
      role="region"
      aria-label="Difficulty points table. Scrolls sideways on small screens."
      tabIndex={0}
      className="relative overflow-x-auto rounded-md border border-rule bg-card"
    >
      <table className="w-full min-w-[40rem] border-collapse text-left">
        <caption className="p-3 text-left text-small text-ink-muted">
          Points for each factor
        </caption>
        <thead>
          <tr className="border-y border-rule">
            <th scope="col" className="p-3 text-small text-ink-muted">
              Factor
            </th>
            {POINT_COLUMNS.map((points) => (
              <th key={points} scope="col" className="p-3 text-data text-ink">
                {points}
                <span className="sr-only"> points</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-rule">
          {DIFFICULTY_FACTORS.map((factor) => (
            <tr key={factor.name}>
              <th
                scope="row"
                className="p-3 align-top text-small font-semibold text-ink"
              >
                {factor.name}
              </th>
              {POINT_COLUMNS.map((points) => {
                const isChosen = chosen.get(factor.name) === points;
                return (
                  <td
                    key={points}
                    className={cn(
                      "p-3 align-top text-small",
                      isChosen
                        ? "bg-paper font-semibold text-ink outline-2 -outline-offset-2 outline-ink"
                        : "text-ink-muted",
                    )}
                  >
                    {factor.cells[points] ?? "Not used"}
                    {isChosen && (
                      <span className="mt-1 block text-data font-normal">
                        {exampleName}
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
