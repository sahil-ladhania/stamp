/**
 * File: budget.ts
 * Purpose: Per-run budget constants for the agent pipeline.
 * Exports: RUN_BUDGET, RunBudget type
 * Used by: agent graph nodes
 */
export type RunBudget = {
  maxDurationMs: number;
  maxPages: number;
  maxRetries: number;
  maxSchemaRepairsPerSection: number;
};

/** Fixed limits per docs/agent-architecture.md section 6. */
export const RUN_BUDGET: RunBudget = {
  maxDurationMs: 120_000,
  maxPages: 6,
  maxRetries: 1,
  maxSchemaRepairsPerSection: 1,
};
