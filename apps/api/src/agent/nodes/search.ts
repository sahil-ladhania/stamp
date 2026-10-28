/**
 * File: search.ts
 * Purpose: Stage 2: finds pages, official docs first. Does nothing yet beyond its stage events.
 * Exports: searchNode
 * Used by: agent/nodes/index.ts
 */
import { noop, stageNode } from "../stage-node.js";

export const searchNode = stageNode("search", noop);
