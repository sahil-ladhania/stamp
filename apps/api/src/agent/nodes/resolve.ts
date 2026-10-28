/**
 * File: resolve.ts
 * Purpose: Stage 0: turns the typed app name or URL into one official domain. Does nothing yet beyond its stage events.
 * Exports: resolveNode
 * Used by: agent/nodes/index.ts
 */
import { noop, stageNode } from "../stage-node.js";

export const resolveNode = stageNode("resolve", noop);
