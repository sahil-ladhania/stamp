/**
 * File: stage-summary.ts
 * Purpose: The one-line summary a stage group shows next to its name, counted from the events of that stage: how many searches,
 *          which pages were read, how many quotes matched. A stage with no events of its own has no summary.
 * Exports: summarizeStage
 * Used by: utils/run-groups.ts
 */
import type { SourceTier } from "@stamp/schema";
import { pluralize } from "./plural";
import type { GroupItem } from "./run-groups";

const TIER_ORDER: readonly { tier: SourceTier; word: string }[] = [
  { tier: "official", word: "official" },
  { tier: "third_party", word: "third party" },
  { tier: "forum", word: "forum" },
];

/** "4 pages read: 3 official, 1 third party". */
function pagesLine(items: readonly GroupItem[]): string | null {
  const pages = items.flatMap((item) => (item.type === "page" ? [item.tier] : []));
  if (pages.length === 0) return null;
  const tiers = TIER_ORDER.map(({ tier, word }) => ({ word, count: pages.filter((value) => value === tier).length }))
    .filter(({ count }) => count > 0)
    .map(({ word, count }) => `${count} ${word}`);
  return `${pluralize(pages.length, "page")} read: ${tiers.join(", ")}`;
}

/** "13 quotes checked: 11 matched, 2 downgraded". */
function quotesLine(items: readonly GroupItem[]): string | null {
  const matched = items.filter((item) => item.type === "kept").length;
  const downgraded = items.filter((item) => item.type === "downgraded").length;
  if (matched + downgraded === 0) return null;
  return `${pluralize(matched + downgraded, "quote")} checked: ${matched} matched, ${downgraded} downgraded`;
}

function searchesLine(items: readonly GroupItem[]): string | null {
  const searches = items.filter((item) => item.type === "search").length;
  if (searches === 0) return null;
  return searches === 1 ? "1 search" : `${searches} searches`;
}

/** Stages 0 and 2 search, 3 reads pages, 5 checks quotes. The others send no events, so they have nothing to count. */
export function summarizeStage(stage: number, items: readonly GroupItem[]): string | null {
  switch (stage) {
    case 0:
    case 2:
      return searchesLine(items);
    case 3:
      return pagesLine(items);
    case 5:
      return quotesLine(items);
    default:
      return null;
  }
}
