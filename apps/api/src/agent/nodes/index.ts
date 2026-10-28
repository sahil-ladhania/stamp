/**
 * File: index.ts
 * Purpose: The default node for each of the nine stages.
 * Exports: defaultNodes
 * Used by: agent/graph.ts
 */
import type { NodeSet } from "../stage-node.js";
import { extractNode } from "./extract.js";
import { fetchNode } from "./fetch.js";
import { planNode } from "./plan.js";
import { probeNode } from "./probe.js";
import { resolveNode } from "./resolve.js";
import { saveNode } from "./save.js";
import { scoreNode } from "./score.js";
import { searchNode } from "./search.js";
import { verifyNode } from "./verify.js";

export const defaultNodes: NodeSet = {
  resolve: resolveNode,
  plan: planNode,
  search: searchNode,
  fetch: fetchNode,
  extract: extractNode,
  verify: verifyNode,
  probe: probeNode,
  score: scoreNode,
  save: saveNode,
};
