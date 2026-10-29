/**
 * File: format.ts
 * Purpose: Small cell formatters for the scorecard: percent, dollars and a markdown table row.
 * Exports: pct, usd, row
 * Used by: evals/lib/scorecard.ts, evals/lib/scorecard-sections.ts
 */

export const pct = (share: number): string => `${Math.round(share * 100)}%`;
export const usd = (value: number | null): string =>
  value === null ? "n/a" : `$${value.toFixed(2)}`;
export const row = (cells: readonly (string | number)[]): string =>
  `| ${cells.join(" | ")} |`;
