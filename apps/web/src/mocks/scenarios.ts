/**
 * File: scenarios.ts
 * Purpose: The `?state=` values each page accepts. The first value is the default.
 * Exports: PAGE_SCENARIOS
 * Used by: pages (App home, Live run, Guide), passed to useMockScenario
 */

export const PAGE_SCENARIOS = {
  'app-home': ['default', 'paused', 'ambiguous'],
  run: ['running', 'done', 'partial', 'error', 'not-oauth'],
  guide: ['full', 'partial', 'not-oauth', 'no-docs'],
} as const
