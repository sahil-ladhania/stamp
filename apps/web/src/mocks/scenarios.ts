/**
 * File: scenarios.ts
 * Purpose: The `?state=` values each page accepts. The first value is the default.
 * Exports: PAGE_SCENARIOS
 * Used by: pages (Landing, Not found, App home, Live run, Guide), passed to useMockScenario
 */

export const PAGE_SCENARIOS = {
  landing: ["default", "video-error"],
  "not-found": ["default", "suggestion", "unknown-guide"],
} as const;

