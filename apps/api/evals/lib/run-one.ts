/**
 * File: run-one.ts
 * Purpose: Runs the real agent in-process for one golden app and returns everything the run left behind: guide, gates, pages, usage, events and log lines.
 * Exports: runOne, RunOneOptions
 * Used by: evals/lib/run-batch.ts
 */
import type { SourceTier } from "@stamp/schema";
import type { AgentOutcome, RunAgentInput } from "../../src/agent/run-agent.js";
import type { RealAgentOptions } from "../../src/agent/run-real-agent.js";
import { stageOf } from "../../src/agent/pipeline.js";
import { toGateFacts } from "../../src/agent/scoring/gate-facts.js";
import type { State } from "../../src/agent/state.js";
import { hashUrl } from "../../src/utils/hash-url.js";
import { captureSaveNode } from "./capture-save-node.js";
import { freshPageCache } from "./fresh-page-cache.js";
import type { Golden } from "./golden.js";
import type { LogTap } from "./log-tap.js";
import {
  emptyUsage,
  parseUsage,
  type GateCapture,
  type PageInfo,
  type RunCapture,
  type TraceEvent,
} from "./types.js";

type Runner = (
  input: RunAgentInput,
  options: RealAgentOptions,
) => Promise<AgentOutcome>;

export type RunOneOptions = {
  tap: LogTap;
  /** Replaces the real agent; tests only. */
  runner?: Runner;
  /** The model names, for pricing; read from the config when not given. */
  models?: { fast: string; strong: string };
  /** Aborts a run that overruns; the agent's own 120 s budget should end it long before. */
  abortAfterMs?: number;
};

const ABORT_AFTER_MS = 150_000;
const VERIFY_STAGE = stageOf("verify");

/** The real agent and the configured model names, imported only when a real run starts. */
async function realAgent(): Promise<{
  runner: Runner;
  models: { fast: string; strong: string };
}> {
  const { runRealAgent } = await import("../../src/agent/run-real-agent.js");
  const { getConfig } = await import("../../src/config.js");
  const config = getConfig();
  return {
    runner: runRealAgent,
    models: {
      fast: config.OPENAI_MODEL_FAST ?? "unknown",
      strong: config.OPENAI_MODEL_STRONG ?? "unknown",
    },
  };
}

/** Gates count only after verify checked their quotes, as in the score stage; each fact keeps the tier of its page. */
function gatesOf(state: State): GateCapture {
  const checked = state.completed.includes(VERIFY_STAGE);
  const facts = toGateFacts(checked ? state.gates : null);
  const tierOf = (url: string | undefined): SourceTier | null =>
    url === undefined
      ? null
      : (state.pages.find((page) => page.urlHash === hashUrl(url))?.tier ??
        null);
  return {
    reviewGate: facts.reviewGate,
    reviewGateTier:
      facts.reviewGate === "unknown"
        ? null
        : tierOf(state.gates?.reviewGateEvidence?.url),
    approvalWait: facts.approvalWait,
    approvalWaitTier:
      facts.approvalWait === "unknown"
        ? null
        : tierOf(state.gates?.approvalWaitEvidence?.url),
  };
}

/** With no final state (the run failed early) the pages are the ones the events announced. */
function pagesFromEvents(events: readonly TraceEvent[]): PageInfo[] {
  return events.flatMap(({ event }) =>
    event.type === "page.fetched"
      ? [{ url: String(event.url), tier: event.tier as SourceTier }]
      : [],
  );
}

/** Runs one app. Never throws for a failed run: the capture says what happened. */
export async function runOne(
  golden: Golden,
  options: RunOneOptions,
): Promise<RunCapture> {
  const real = options.runner && options.models ? null : await realAgent();
  const runner = options.runner ?? real?.runner;
  const models = options.models ?? real?.models;
  if (!runner || !models)
    throw new Error("runOne needs a runner and model names");

  const typed = golden.typedNames[0] ?? golden.slug;
  const startedMs = Date.now();
  const runId = `eval-${golden.slug}-${startedMs.toString(36)}`;
  const events: TraceEvent[] = [];
  // A holder, not a variable: TypeScript would narrow a variable assigned in a callback to never.
  const final: { state: State | null; guide: RunCapture["guide"] } = {
    state: null,
    guide: null,
  };
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    options.abortAfterMs ?? ABORT_AFTER_MS,
  );

  const input: RunAgentInput = {
    runId,
    app: typed,
    slug: golden.slug,
    signal: controller.signal,
    emit: (event) => {
      events.push({ tMs: Date.now() - startedMs, event: { ...event } });
      return Promise.resolve();
    },
  };
  let outcome: AgentOutcome;
  try {
    outcome = await runner(input, {
      nodes: {
        save: captureSaveNode((state, built) => {
          final.state = state;
          final.guide = built.ok ? built.guide : null;
        }),
      },
      pageCache: freshPageCache(),
    });
  } finally {
    clearTimeout(timer);
  }

  const logs = options.tap.linesFor(runId);
  const summary = logs.find((line) => line.message === "run summary");
  const { state } = final;
  return {
    slug: golden.slug,
    typed,
    startedAt: new Date(startedMs).toISOString(),
    outcome: outcome.ok
      ? { ok: true, status: outcome.status }
      : { ok: false, code: outcome.failure.code },
    durationMs:
      typeof summary?.durationMs === "number"
        ? summary.durationMs
        : Date.now() - startedMs,
    stageReached:
      typeof summary?.stageReached === "number" ? summary.stageReached : 0,
    guide: final.guide,
    gates: state ? gatesOf(state) : null,
    pages: state
      ? state.pages.map(({ url, tier }) => ({ url, tier }))
      : pagesFromEvents(events),
    searchResults: state
      ? state.searchResults.map(({ url, tier }) => ({ url, tier }))
      : [],
    retried: (state?.retryCount ?? 0) > 0,
    usage: summary ? parseUsage(summary) : emptyUsage(),
    models,
    events,
    logs,
  };
}
