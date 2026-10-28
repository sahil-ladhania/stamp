/**
 * File: format-list.ts
 * Purpose: Joins words into a sentence list: `Steps, Blockers and Source conflicts`.
 * Exports: formatList
 * Used by: components/guide/PartialNotice.tsx
 */

export function formatList(items: readonly string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}
