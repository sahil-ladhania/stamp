/**
 * File: routes.ts
 * Purpose: The graph's routing rules: the budget check before each node (a stop goes through verify when there are unchecked drafts, then score), and the one conditional retry edge after verify.
 * Exports: routeTo, routeAfterVerify, shouldRetry, isRetryEntry, hasUnverifiedWork, BUDGET_STOP_TARGETS, Route
 * Used by: agent/graph.ts
 */
import type { RunnableConfig } from "@langchain/core/runnables";
import { END } from "@langchain/langgraph";
import { canRetry, checkBudget, type BudgetClock } from "./budget.js";
import { getDeps } from "./deps.js";
import { stageOf, type NodeName } from "./pipeline.js";
import type { State } from "./state.js";

export type Route = NodeName | typeof END;

/** Where a failed budget check can send the run: verify, when it has drafts to check, otherwise score. */
export const BUDGET_STOP_TARGETS = ["verify", "score"] as const;

const VERIFY_STAGE = stageOf("verify");

/**
 * True when the run holds drafts or gates that verify has not checked: a drafted section or the gates
 * result exists, and verify has not run yet. Verify is code only and cheap, and claims that were never
 * checked cannot be published, so a run that stops on time still checks what it has.
 */
export function hasUnverifiedWork(state: State): boolean {
  const drafted = Object.values(state.drafts).some(
    (draft) => draft?.status === "drafted",
  );
  return (
    (drafted || state.gates !== null) && !state.completed.includes(VERIFY_STAGE)
  );
}

/**
 * Edge into `node`: a failed run ends, otherwise the node runs when its time check passes. An exhausted
 * budget goes to verify if there is unchecked work, then on to score and save (the run is then partial);
 * with nothing to check it goes straight to score. Score is cheap code-only work, so it always runs.
 * The budget is checked here, before each node starts.
 */
export function routeTo(node: NodeName) {
  return (state: State, config: RunnableConfig): Route => {
    if (state.failure) {
      return END;
    }
    const { clock, now } = getDeps(config);
    if (checkBudget(clock, now(), node).ok) {
      return node;
    }
    return node !== "verify" && hasUnverifiedWork(state) ? "verify" : "score";
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
