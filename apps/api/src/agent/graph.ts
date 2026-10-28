/**
 * File: graph.ts
 * Purpose: Wires the nine stages into the LangGraph pipeline: a budget check before each node and one retry edge.
 * Exports: buildGraph, AgentGraph, RECURSION_LIMIT
 * Used by: agent/run-real-agent.ts
 */
import { END, START, StateGraph } from "@langchain/langgraph";
import { defaultNodes } from "./nodes/index.js";
import { isRetryEntry, routeAfterVerify, routeTo } from "./routes.js";
import type { NodeFn, NodeSet } from "./stage-node.js";
import { AgentState } from "./state.js";

/**
 * LangGraph stops a run after 25 steps by default. The longest run (one retry) takes 13 node runs,
 * so 40 leaves headroom while still ending a routing bug.
 */
export const RECURSION_LIMIT = 40;

/**
 * An edge cannot write state, so the search node counts the retry: it starts the retry pass when
 * verify has already reported missing sections. This is what makes the verify -> search edge fire once.
 */
function countRetry(search: NodeFn): NodeFn {
  return async (state, config) => {
    const update = await search(state, config);
    return isRetryEntry(state)
      ? { ...update, retryCount: state.retryCount + 1 }
      : update;
  };
}

/**
 * Stages 0 to 8 in order. Every edge goes through `routeTo`, which ends a failed run and sends an
 * exhausted budget to score, then save; the one extra edge is verify -> search (see routes.ts).
 * `overrides` swaps nodes, for tests and for the steps that fill the stages in.
 */
export function buildGraph(overrides: Partial<NodeSet> = {}) {
  const nodes: NodeSet = { ...defaultNodes, ...overrides };
  return new StateGraph(AgentState)
    .addNode("resolve", nodes.resolve)
    .addNode("plan", nodes.plan)
    .addNode("search", countRetry(nodes.search))
    .addNode("fetch", nodes.fetch)
    .addNode("extract", nodes.extract)
    .addNode("verify", nodes.verify)
    .addNode("probe", nodes.probe)
    .addNode("score", nodes.score)
    .addNode("save", nodes.save)
    .addConditionalEdges(START, routeTo("resolve"), ["resolve", "score"])
    .addConditionalEdges("resolve", routeTo("plan"), ["plan", "score", END])
    .addConditionalEdges("plan", routeTo("search"), ["search", "score", END])
    .addConditionalEdges("search", routeTo("fetch"), ["fetch", "score", END])
    .addConditionalEdges("fetch", routeTo("extract"), ["extract", "score", END])
    .addConditionalEdges("extract", routeTo("verify"), ["verify", "score", END])
    .addConditionalEdges("verify", routeAfterVerify, [
      "search",
      "probe",
      "score",
      END,
    ])
    .addConditionalEdges("probe", routeTo("score"), ["score", END])
    .addConditionalEdges("score", routeTo("save"), ["save", END])
    .addEdge("save", END)
    .compile();
}

export type AgentGraph = ReturnType<typeof buildGraph>;
