/**
 * File: sort-guides.ts
 * Purpose: Pure sort of guide summaries by difficulty. Ties always break alphabetically, in either direction.
 * Exports: SortOrder, sortByDifficulty
 * Used by: components/app-home/LibrarySection.tsx
 */
import type { GuideSummary } from "@/mocks/types";

export type SortOrder = "easiest" | "hardest";

/** Returns a new array; the input is not changed. */
export function sortByDifficulty(
  guides: readonly GuideSummary[],
  order: SortOrder,
): GuideSummary[] {
  const direction = order === "easiest" ? 1 : -1;
  return [...guides].sort(
    (a, b) =>
      direction * (a.difficulty - b.difficulty) ||
      a.appName.localeCompare(b.appName),
  );
}
