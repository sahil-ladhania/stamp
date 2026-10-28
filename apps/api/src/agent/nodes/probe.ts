/**
 * File: probe.ts
 * Purpose: Stage 6: calls the authorize URL with a dummy client ID. Does nothing yet beyond its stage events.
 * Exports: probeNode
 * Used by: agent/nodes/index.ts
 */
import { noop, stageNode } from "../stage-node.js";

export const probeNode = stageNode("probe", noop);
