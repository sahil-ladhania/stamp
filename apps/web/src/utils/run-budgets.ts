/**
 * File: run-budgets.ts
 * Purpose: The per-run budgets from docs/agent-architecture.md section 6, for the budget strip.
 * Exports: RUN_TIME_LIMIT_MS, RUN_PAGE_LIMIT, RUN_RETRY_LIMIT
 * Used by: components/run/BudgetStrip.tsx, components/run/run-copy.ts
 */

export const RUN_TIME_LIMIT_MS = 120_000;
export const RUN_PAGE_LIMIT = 6;
export const RUN_RETRY_LIMIT = 1;
