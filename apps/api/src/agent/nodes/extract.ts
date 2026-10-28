/**
 * File: extract.ts
 * Purpose: Stage 4: fills each guide section from the pages (strong model). Does nothing yet beyond its stage events.
 * Exports: extractNode
 * Used by: agent/nodes/index.ts
 */
import { noop, stageNode } from "../stage-node.js";

export const extractNode = stageNode("extract", noop);
