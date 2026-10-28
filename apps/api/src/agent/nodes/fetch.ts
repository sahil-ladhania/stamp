/**
 * File: fetch.ts
 * Purpose: Stage 3: reads up to 6 pages, reusing cached ones. Does nothing yet beyond its stage events.
 * Exports: fetchNode
 * Used by: agent/nodes/index.ts
 */
import { noop, stageNode } from "../stage-node.js";

export const fetchNode = stageNode("fetch", noop);
