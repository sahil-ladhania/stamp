/**
 * File: score.ts
 * Purpose: Stage 7: applies the difficulty rule and classifies the archetype. Does nothing yet beyond its stage events.
 * Exports: scoreNode
 * Used by: agent/nodes/index.ts
 */
import { noop, stageNode } from "../stage-node.js";

export const scoreNode = stageNode("score", noop);
