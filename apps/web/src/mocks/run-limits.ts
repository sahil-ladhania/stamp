/**
 * File: run-limits.ts
 * Purpose: DISPLAY COPY of the run budgets and failure responses from docs/agent-architecture.md,
 *          docs/product-architecture.md and docs/solution.md. The docs give no numbers for the
 *          rate limit or the daily cap, so none are shown.
 * Exports: RunLimit, RUN_LIMITS, UnfinishedCase, UNFINISHED_CASES
 * Used by: components/verify/LimitsSection.tsx
 */

export type RunLimit = { name: string; value: string; effect: string };

export const RUN_LIMITS: readonly RunLimit[] = [
  {
    name: "Run time",
    value: "120 seconds",
    effect:
      "Stamp saves what it has, marks the missing sections Uncertain and offers Retry run.",
  },
  {
    name: "Pages read",
    value: "6 per run",
    effect: "A run reads no more than this.",
  },
  {
    name: "Retries",
    value: "1",
    effect:
      "One retry when a section has no matching quote. After that the section is Uncertain.",
  },
  {
    name: "Schema repairs",
    value: "1 per section",
    effect:
      "If the model's output fails the schema, Stamp retries that section once with the error. Then it marks the section Uncertain.",
  },
  {
    name: "Requests per visitor",
    value: "Limited per IP address",
    effect: "Try again in a minute.",
  },
  {
    name: "Runs per day",
    value: "A daily cap",
    effect: "Live generation pauses. Library guides still open.",
  },
  {
    name: "Freshness",
    value: "7 days",
    effect:
      "A live guide and its fetched pages are reused for 7 days, then Refresh runs again. Two visitors asking for the same app share one run.",
  },
];

export type UnfinishedCase = { situation: string; response: string };

export const UNFINISHED_CASES: readonly UnfinishedCase[] = [
  {
    situation: "No public docs found",
    response: "Stamp says so and suggests contacting the provider.",
  },
  {
    situation: "The app uses API keys, not OAuth",
    response: "Stamp marks it out of scope.",
  },
  {
    situation: "The name matches several apps",
    response: 'Stamp asks "Did you mean".',
  },
];
