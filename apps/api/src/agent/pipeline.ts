/**
 * File: pipeline.ts
 * Purpose: The fixed order of the nine stages: node name, stage number and display name, plus the partial-run rule.
 * Exports: PIPELINE, NodeName, stageOf, stageName, isPartial
 * Used by: agent/graph.ts, agent/stage-node.ts, agent/run-real-agent.ts, agent/stub/run-stub-agent.ts
 */
import { STAGES, type StageId } from "@stamp/schema";
import type { BudgetNode } from "./budget.js";

/** Graph node names are the budget node names, so one name keys the node, its time cap and its stage. */
export type NodeName = BudgetNode;

/** Stages 0 to 8 in run order (docs/agent-architecture.md section 1). */
export const PIPELINE: readonly { node: NodeName; stage: StageId }[] = [
  { node: "resolve", stage: 0 },
  { node: "plan", stage: 1 },
  { node: "search", stage: 2 },
  { node: "fetch", stage: 3 },
  { node: "extract", stage: 4 },
  { node: "verify", stage: 5 },
  { node: "probe", stage: 6 },
  { node: "score", stage: 7 },
  { node: "save", stage: 8 },
];

export function stageOf(node: NodeName): StageId {
  const entry = PIPELINE.find((item) => item.node === node);
  if (!entry) {
    throw new RangeError(`Unknown pipeline node: ${node}`);
  }
  return entry.stage;
}

/** The stage's display name from @stamp/schema, shown in the run timeline. */
export function stageName(stage: StageId): string {
  return (
    STAGES.find((definition) => definition.id === stage)?.name ??
    `stage_${stage}`
  );
}

/**
 * A run is partial when a node flagged it, or when a stage before save never ran to the end
 * (a budget stop routes straight to save, so the stages in between are skipped).
 */
export function isPartial(run: {
  partial: boolean;
  completed: readonly StageId[];
}): boolean {
  return (
    run.partial ||
    PIPELINE.some(
      ({ node, stage }) => node !== "save" && !run.completed.includes(stage),
    )
  );
}
