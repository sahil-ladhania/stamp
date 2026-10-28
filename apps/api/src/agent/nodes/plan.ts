/**
 * File: plan.ts
 * Purpose: Stage 1: writes the targeted search queries (fast model). Does nothing yet beyond its stage events.
 * Exports: planNode
 * Used by: agent/nodes/index.ts
 */
import { noop, stageNode } from "../stage-node.js";

export const planNode = stageNode("plan", noop);
