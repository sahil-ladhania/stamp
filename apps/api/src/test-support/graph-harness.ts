/**
 * File: graph-harness.ts
 * Purpose: Test rig for the agent graph: a fake clock, a recorded event list, an abort controller and a state factory.
 * Exports: createHarness, makeState, trace, recorded, NOOP_NODES, Harness
 * Used by: agent/graph*.test.ts, agent/state.test.ts, agent/routes.test.ts, agent/stage-node.test.ts, agent/emit.test.ts, agent/run-real-agent*.test.ts
 */
import type { RunnableConfig } from "@langchain/core/runnables";
import { createRunUsage } from "../lib/usage.js";
import { startBudget } from "../agent/budget.js";
import type { AgentDeps } from "../agent/deps.js";
import { buildGraph, RECURSION_LIMIT } from "../agent/graph.js";
import type { AgentEvent } from "../agent/run-agent.js";
import type { NodeName } from "../agent/pipeline.js";
import {
  noop,
  stageNode,
  type NodeFn,
  type NodeSet,
} from "../agent/stage-node.js";
import { PIPELINE } from "../agent/pipeline.js";
import type { State } from "../agent/state.js";

const START_TIME = 1_000_000;

/** Nine stage nodes that only emit their stage events: the graph wiring is tested without any real stage. */
export const NOOP_NODES: NodeSet = Object.fromEntries(
  PIPELINE.map(({ node }) => [node, stageNode(node, noop)]),
) as NodeSet;

/** A complete state with every channel at its starting value. */
export function makeState(overrides: Partial<State> = {}): State {
  return {
    typed: "Notion",
    slug: "notion",
    app: null,
    queries: [],
    searchResults: [],
    pages: [],
    drafts: {},
    gates: null,
    claims: [],
    conflicts: [],
    retryCount: 0,
    missingSections: [],
    probeResult: null,
    checks: [],
    difficulty: null,
    archetype: null,
    guide: null,
    libraryProtected: false,
    partial: false,
    failure: null,
    completed: [],
    ...overrides,
  };
}

/** Events as "type:stage" strings, for order assertions. */
export function trace(events: readonly AgentEvent[]): string[] {
  return events.map((event) =>
    "stage" in event ? `${event.type}:${event.stage}` : event.type,
  );
}

export type Harness = ReturnType<typeof createHarness>;

/** A run's deps with time under test control: `advance` moves the clock, `setRemaining` sets the budget left. */
export function createHarness(options: { budgetMs?: number } = {}) {
  const time = { now: START_TIME };
  const events: AgentEvent[] = [];
  const controller = new AbortController();
  const clock = startBudget(START_TIME, options.budgetMs);
  const deps: AgentDeps = {
    runId: "run_1",
    emit: (event) => {
      events.push(event);
      return Promise.resolve();
    },
    clock,
    now: () => time.now,
    usage: createRunUsage(),
    extractConcurrency: 5,
    probeEnabled: true,
  };
  const config: RunnableConfig = {
    configurable: { deps },
    signal: controller.signal,
  };
  return {
    events,
    deps,
    config,
    controller,
    advance: (ms: number): void => {
      time.now += ms;
    },
    setRemaining: (ms: number): void => {
      time.now = START_TIME + clock.maxDurationMs - ms;
    },
    /** Runs the graph with no-op nodes, and these swapped in. */
    run: (overrides: Partial<NodeSet> = {}) =>
      buildGraph({ ...NOOP_NODES, ...overrides }).invoke(
        { typed: "Notion", slug: "notion" },
        { ...config, recursionLimit: RECURSION_LIMIT },
      ),
  };
}

/** A stage node that records the state it was called with, then runs `body` (a no-op by default). */
export function recorded(node: NodeName, body?: NodeFn) {
  const calls: State[] = [];
  const fn = stageNode(node, (state, config) => {
    calls.push(state);
    return body ? body(state, config) : Promise.resolve({});
  });
  return { fn, calls };
}
