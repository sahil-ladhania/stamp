/**
 * File: scenarios.ts
 * Purpose: The `?state=` values each page accepts. The first value is the default.
 * Exports: PAGE_SCENARIOS, RunScenario, GuideScenario
 * Used by: pages (Landing, Not found, App home, Live run, Guide), passed to useMockScenario
 */

export const PAGE_SCENARIOS = {
  landing: ["default", "video-error"],
  "not-found": ["default", "suggestion", "unknown-guide"],
  run: ["running", "done", "partial", "error", "not-oauth", "no-docs"],
  guide: ["full", "partial", "not-oauth", "no-docs"],
} as const;

export type RunScenario = (typeof PAGE_SCENARIOS)["run"][number];
export type GuideScenario = (typeof PAGE_SCENARIOS)["guide"][number];
