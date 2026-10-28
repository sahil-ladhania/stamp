/**
 * File: node-timing.ts
 * Purpose: The time a node may give one external call: its ceiling, cut to leave room for the stages after it, never zero.
 * Exports: callTimeoutMs, MIN_CALL_MS
 * Used by: agent/nodes/resolve.ts, agent/nodes/plan.ts, agent/nodes/search.ts, agent/nodes/fetch.ts
 */
import type { RunnableConfig } from "@langchain/core/runnables";
import { nodeTimeoutMs, remainingMs } from "./budget.js";
import { getDeps } from "./deps.js";
import type { NodeName } from "./pipeline.js";

/**
 * The shortest call worth making. The budget check lets a node start with less time than the stages after
 * it reserve, so the cut ceiling can reach zero; this floor keeps the call from timing out before it begins.
 */
export const MIN_CALL_MS = 1_500;

/** Milliseconds for one call in `node`: its time cap (smaller on a retry pass), never above the time left. */
export function callTimeoutMs(
  config: RunnableConfig,
  node: NodeName,
  options: { retryPass?: boolean } = {},
): number {
  const { clock, now } = getDeps(config);
  const at = now();
  return Math.min(
    remainingMs(clock, at),
    Math.max(MIN_CALL_MS, nodeTimeoutMs(clock, at, node, options)),
  );
}
