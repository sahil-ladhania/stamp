/**
 * File: verify.ts
 * Purpose: Stage 5: checks each quote against its page and labels the claim. Does nothing yet beyond its stage events.
 * Exports: verifyNode
 * Used by: agent/nodes/index.ts
 */
import { noop, stageNode } from "../stage-node.js";

export const verifyNode = stageNode("verify", noop);
