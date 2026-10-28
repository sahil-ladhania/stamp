/**
 * File: routes.ts
 * Purpose: The graph's routing rules: the budget check before each node, and the one conditional retry edge after verify.
 * Exports: routeTo, routeAfterVerify, shouldRetry, isRetryEntry, Route
 * Used by: agent/graph.ts
 */
import type { RunnableConfig } from "@langchain/core/runnables";
import { END } from "@langchain/langgraph";
import { canRetry, checkBudget, type BudgetClock } from "./budget.js";
import { getDeps } from "./deps.js";
import type { NodeName } from "./pipeline.js";
import type { State } from "./state.js";

export type Route = NodeName | typeof END;

/**
 * Edge into `node`: a failed run ends, an exhausted budget skips ahead to save (the run is then
 * partial), otherwise the node runs. The budget is checked here, before each node starts.
 */
export function routeTo(node: NodeName) {
  return (state: State, config: RunnableConfig): Route => {
    if (state.failure) {
      return END;
    }
    const { clock, now } = getDeps(config);
    return checkBudget(clock, now(), node).ok ? node : "save";
  };
}

/** True when a section has no matched quote, the one retry is unused, and enough time remains. */
export function shouldRetry(
  state: State,
  clock: BudgetClock,
  now: number,
): boolean {
  return (
    state.missingSections.length > 0 && canRetry(clock, now, state.retryCount)
  );
}

/** True for the search run that begins the retry pass: verify has already reported missing sections. */
export function isRetryEntry(state: State): boolean {
  return state.missingSections.length > 0;
}

/** The conditional edge after verify: back to search at most once, otherwise on to probe. */
export function routeAfterVerify(state: State, config: RunnableConfig): Route {
  if (state.failure) {
    return END;
  }
  const { clock, now } = getDeps(config);
  const next: NodeName = shouldRetry(state, clock, now()) ? "search" : "probe";
  return routeTo(next)(state, config);
}
