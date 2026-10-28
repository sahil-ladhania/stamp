/**
 * File: budget.ts
 * Purpose: Run budget: fixed limits, per-node time caps, and pure checks on elapsed time, pages and retries.
 * Exports: RUN_BUDGET, RunBudget, NODE_CAP_MS, RETRY_NODE_CAP_MS, NODE_MIN_REMAINING_MS, FIRST_PASS_PAGE_CAP, RETRY_MIN_REMAINING_MS, startBudget, elapsedMs, remainingMs, checkBudget, nodeTimeoutMs, pageAllowance, canRetry, canRepairSchema
 * Used by: services/run-executor.ts, agent graph and nodes
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

export type BudgetNode =
  | "resolve"
  | "plan"
  | "search"
  | "fetch"
  | "extract"
  | "verify"
  | "probe"
  | "score"
  | "save";

/** Time ceilings per node on the first pass: 74 s in total. */
export const NODE_CAP_MS: Record<BudgetNode, number> = {
  resolve: 6_000,
  plan: 6_000,
  search: 8_000,
  fetch: 12_000,
  extract: 30_000,
  verify: 2_000,
  probe: 4_000,
  score: 1_000,
  save: 5_000,
};

/** Tighter ceilings for the retry pass (search, fetch, a smaller extract, verify): 30 s, so 104 s worst case. */
export const RETRY_NODE_CAP_MS: Partial<Record<BudgetNode, number>> = {
  search: 6_000,
  fetch: 8_000,
  extract: 14_000,
  verify: 2_000,
};

/** A node is not started with less than this left; code-only nodes (0) always run. */
export const NODE_MIN_REMAINING_MS: Record<BudgetNode, number> = {
  resolve: 3_000,
  plan: 3_000,
  search: 4_000,
  fetch: 6_000,
  extract: 15_000,
  verify: 0,
  probe: 3_000,
  score: 0,
  save: 0,
};

/** Time kept back for the nodes that still have to run after this one (verify, score, save). */
const RESERVE_AFTER_MS: Record<BudgetNode, number> = {
  resolve: 8_000,
  plan: 8_000,
  search: 8_000,
  fetch: 8_000,
  extract: 8_000,
  verify: 6_000,
  probe: 6_000,
  score: 0,
  save: 0,
};

/** The first pass leaves room for the retry: 6 pages in total, 4 on the first pass. */
export const FIRST_PASS_PAGE_CAP = 4;

/** A retry only starts when this much of the budget is left after verify. */
export const RETRY_MIN_REMAINING_MS = 40_000;

/** Clock values are plain numbers (milliseconds) so every check is a pure function of `now`. */
export type BudgetClock = { startedAt: number; maxDurationMs: number };

export type BudgetCheck = { ok: true } | { ok: false; reason: "time_budget" };

/** Starts the run clock; `maxDurationMs` can lower the budget (tests, env) but never raise it above 120 s. */
export function startBudget(
  now: number,
  maxDurationMs: number = RUN_BUDGET.maxDurationMs,
): BudgetClock {
  if (!Number.isFinite(maxDurationMs) || maxDurationMs <= 0) {
    throw new RangeError(
      `maxDurationMs must be a positive number, got ${maxDurationMs}`,
    );
  }
  return {
    startedAt: now,
    maxDurationMs: Math.min(
      Math.floor(maxDurationMs),
      RUN_BUDGET.maxDurationMs,
    ),
  };
}

/** Milliseconds since the run started (never negative). */
export function elapsedMs(clock: BudgetClock, now: number): number {
  return Math.max(0, now - clock.startedAt);
}

/** Milliseconds left in the run (never negative). */
export function remainingMs(clock: BudgetClock, now: number): number {
  return Math.max(0, clock.maxDurationMs - elapsedMs(clock, now));
}

/** Checked before each node; a failed check routes the run to a partial save. */
export function checkBudget(
  clock: BudgetClock,
  now: number,
  node: BudgetNode,
): BudgetCheck {
  return remainingMs(clock, now) >= NODE_MIN_REMAINING_MS[node]
    ? { ok: true }
    : { ok: false, reason: "time_budget" };
}

/** The node's ceiling, cut so the verify, score and save steps after it still fit; never negative. */
export function nodeTimeoutMs(
  clock: BudgetClock,
  now: number,
  node: BudgetNode,
  options: { retryPass?: boolean } = {},
): number {
  const cap =
    (options.retryPass ? RETRY_NODE_CAP_MS[node] : undefined) ??
    NODE_CAP_MS[node];
  return Math.max(
    0,
    Math.min(cap, remainingMs(clock, now) - RESERVE_AFTER_MS[node]),
  );
}

/** Pages the fetch node may still fetch (cache hits count): 4 on the first pass, the rest on the retry. */
export function pageAllowance(
  pagesFetched: number,
  retryPass: boolean,
): number {
  const left = Math.max(0, RUN_BUDGET.maxPages - pagesFetched);
  return retryPass ? left : Math.min(FIRST_PASS_PAGE_CAP, left);
}

/** True when the one retry is unused and enough time remains. */
export function canRetry(
  clock: BudgetClock,
  now: number,
  retryCount: number,
): boolean {
  return (
    retryCount < RUN_BUDGET.maxRetries &&
    remainingMs(clock, now) >= RETRY_MIN_REMAINING_MS
  );
}

/** True while a section has not used up its schema-repair attempt. */
export function canRepairSchema(repairsUsed: number): boolean {
  return repairsUsed < RUN_BUDGET.maxSchemaRepairsPerSection;
}
