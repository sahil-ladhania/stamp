/**
 * File: stage-node.ts
 * Purpose: Wraps a stage body so it emits stage.started and stage.done and records that the stage completed.
 * Exports: stageNode, noop, NodeFn, NodeSet
 * Used by: agent/graph.ts, agent/nodes/*
 */
import type { RunnableConfig } from "@langchain/core/runnables";
import { getDeps } from "./deps.js";
import { emit } from "./emit.js";
import { stageName, stageOf, type NodeName } from "./pipeline.js";
import type { State, StateUpdate } from "./state.js";

export type NodeFn = (
  state: State,
  config: RunnableConfig,
) => Promise<StateUpdate>;
export type NodeSet = Record<NodeName, NodeFn>;

/** A stage that does nothing yet; each node file swaps it for its real body in a later step. */
export const noop: NodeFn = () => Promise.resolve({});

/**
 * Emits stage.started, runs the body, then emits stage.done with its duration and marks the stage completed.
 * A body that returns a failure ends the run there: its stage never emits stage.done (as in the stub agent).
 */
export function stageNode(node: NodeName, body: NodeFn): NodeFn {
  const stage = stageOf(node);
  return async (state, config) => {
    const { now } = getDeps(config);
    const startedAt = now();
    await emit(config, {
      type: "stage.started",
      stage,
      name: stageName(stage),
    });
    const update = await body(state, config);
    if (update.failure) {
      return update;
    }
    await emit(config, {
      type: "stage.done",
      stage,
      durationMs: Math.max(0, now() - startedAt),
    });
    return { ...update, completed: [stage] };
  };
}
