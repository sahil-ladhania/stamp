/**
 * File: sort-guides.ts
 * Purpose: Pure sort of guide summaries by difficulty. Ties always break alphabetically, in either direction. A guide that is Not rated sorts after every rated one, in either direction, by name only: its stored difficulty is a lower bound, not a score.
 * Exports: SortOrder, sortByDifficulty
 * Used by: components/app-home/LibrarySection.tsx
 */
import type { GuideSummary } from "@stamp/schema";
import { isRated } from "./difficulty-rating";

export type SortOrder = "easiest" | "hardest";

/** Returns a new array; the input is not changed. */
export function sortByDifficulty(
  guides: readonly GuideSummary[],
  order: SortOrder,
): GuideSummary[] {
  const direction = order === "easiest" ? 1 : -1;
  return [...guides].sort((a, b) => {
    const aRated = isRated(a.archetype);
    if (aRated !== isRated(b.archetype)) return aRated ? -1 : 1;
    const byDifficulty = aRated ? direction * (a.difficulty - b.difficulty) : 0;
    return byDifficulty || a.appName.localeCompare(b.appName);
  });
}
