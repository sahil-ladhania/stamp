/**
 * File: deps.ts
 * Purpose: Per-run dependencies passed to every node and router through the graph config, never through state.
 * Exports: AgentDeps, getDeps
 * Used by: agent/emit.ts, agent/routes.ts, agent/stage-node.ts, agent/run-real-agent.ts, agent/nodes/*
 */
import type { RunnableConfig } from "@langchain/core/runnables";
import type { RunUsage } from "../lib/usage.js";
import type { BudgetClock } from "./budget.js";
import type { AgentEvent } from "./run-agent.js";

export type AgentDeps = {
  runId: string;
  /** Sends one event to the run's stream; resolves when it has been published. */
  emit: (event: AgentEvent) => Promise<void>;
  clock: BudgetClock;
  /** Milliseconds now; injected so budget tests control time. */
  now: () => number;
  /** The run's token and call meter; pass it to every model and Tavily call. */
  usage: RunUsage;
  /** How many extraction calls run at once (AGENT_EXTRACT_CONCURRENCY). */
  extractConcurrency: number;
};

function isDeps(value: unknown): value is AgentDeps {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  return (
    typeof Reflect.get(value, "runId") === "string" &&
    typeof Reflect.get(value, "emit") === "function" &&
    typeof Reflect.get(value, "now") === "function" &&
    typeof Reflect.get(value, "clock") === "object" &&
    typeof Reflect.get(value, "usage") === "object" &&
    typeof Reflect.get(value, "extractConcurrency") === "number"
  );
}

/** The run's deps from the graph config; throws if the graph was invoked without them. */
export function getDeps(config: RunnableConfig): AgentDeps {
  const deps: unknown = config.configurable?.deps;
  if (!isDeps(deps)) {
    throw new Error("The graph was invoked without the run's dependencies");
  }
  return deps;
}
