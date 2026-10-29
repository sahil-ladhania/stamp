/**
 * File: types.ts
 * Purpose: Shapes shared across the eval harness: what one run captures and what scoring says about it.
 * Exports: RunCapture, AppScore, UsageSummary, GateCapture, GateEvidence, PageInfo, SearchResultInfo, ResolveHit, TraceEvent, Outcome, Verdict, ScoreStatus, emptyUsage, parseUsage
 * Used by: evals/scoring/*, evals/lib/*, evals/cli.ts
 */
import type { Guide, SourceTier } from "@stamp/schema";
import type {
  ApprovalWait,
  ReviewGate,
} from "../../src/agent/scoring/difficulty.js";
import type { ClaimQuality } from "../scoring/claim-quality.js";
import type { Contradiction } from "../scoring/contradictions.js";
import type { Verdict } from "../scoring/gate.js";
import type { GoldenRecall } from "../scoring/golden-recall.js";
import type { ScopeScore } from "../scoring/scopes.js";
import type { SourceScore } from "../scoring/sources.js";
import type { BlockerVerdict } from "../scoring/top-blocker.js";

export type { Verdict };

export type PageInfo = { url: string; tier: SourceTier };

/** The quote and page behind a verified gate fact. */
export type GateEvidence = { url: string; quote: string };

/** The verified gate facts, the quote and URL behind each, and the tier of the page that backs it. */
export type GateCapture = {
  reviewGate: ReviewGate;
  reviewGateTier: SourceTier | null;
  reviewGateEvidence: GateEvidence | null;
  approvalWait: ApprovalWait;
  approvalWaitTier: SourceTier | null;
  approvalWaitEvidence: GateEvidence | null;
};

/** A search result as the run saw it: tier, title, Tavily's score, and the planned topics whose queries found it. */
export type SearchResultInfo = PageInfo & {
  title?: string;
  score?: number;
  topics?: string[];
};

/** One hit of the resolve search, from which the official domain was chosen. */
export type ResolveHit = { url: string; title: string };

export type Outcome =
  { ok: true; status: "done" | "partial" } | { ok: false; code: string };

export type TraceEvent = { tMs: number; event: Record<string, unknown> };

/** The run summary's counters; the numbers the agent already logs once per run. */
export type UsageSummary = {
  fastCalls: number;
  fastInputTokens: number;
  fastOutputTokens: number;
  strongCalls: number;
  strongInputTokens: number;
  strongOutputTokens: number;
  totalTokens: number;
  tavilySearchCalls: number;
  tavilyExtractCalls: number;
  tavilyCredits: number;
  pagesFetched: number;
  pageCacheHits: number;
};

export const emptyUsage = (): UsageSummary => ({
  fastCalls: 0,
  fastInputTokens: 0,
  fastOutputTokens: 0,
  strongCalls: 0,
  strongInputTokens: 0,
  strongOutputTokens: 0,
  totalTokens: 0,
  tavilySearchCalls: 0,
  tavilyExtractCalls: 0,
  tavilyCredits: 0,
  pagesFetched: 0,
  pageCacheHits: 0,
});

/** Reads the counters out of a `run summary` log line; a missing or non-numeric field counts 0. */
export function parseUsage(line: Record<string, unknown>): UsageSummary {
  const usage = emptyUsage();
  for (const key of Object.keys(usage) as (keyof UsageSummary)[]) {
    const value = line[key];
    usage[key] = typeof value === "number" ? value : 0;
  }
  return usage;
}

/** Everything one in-process run leaves behind, before any scoring. */
export type RunCapture = {
  slug: string;
  typed: string;
  startedAt: string;
  outcome: Outcome;
  durationMs: number;
  stageReached: number;
  /** Null when the run failed before the save stage. */
  guide: Guide | null;
  gates: GateCapture | null;
  /** Pages the run held (read), and every search result it saw. */
  pages: PageInfo[];
  searchResults: SearchResultInfo[];
  /** The resolve search's hits; empty for a run that was saved before they were captured. */
  resolveHits: ResolveHit[];
  retried: boolean;
  usage: UsageSummary;
  models: { fast: string; strong: string };
  events: TraceEvent[];
  logs: Record<string, unknown>[];
};

export type ScoreStatus = "done" | "partial" | "failed";

/** One app's scores: every number in scorecard.md comes from here. */
export type AppScore = {
  slug: string;
  set: "tuning" | "holdout";
  status: ScoreStatus;
  failureCode: string | null;
  durationMs: number;
  within120s: boolean;
  pagesHeld: number;
  pagesFetched: number;
  cacheHits: number;
  retries: number;
  tokens: number;
  tavilyCredits: number;
  costUsd: number | null;
  sources: SourceScore & { heldWrongProduct: string[] };
  gate: { found: ReviewGate; verdict: Verdict; tier: SourceTier | null };
  wait: { found: string; verdict: Verdict };
  scopes: ScopeScore;
  durations: { total: number; ok: number; unknown: number; prose: string[] };
  topBlocker: BlockerVerdict;
  contradictions: Contradiction[];
  labels: {
    claims: number;
    sourced: number;
    tested: number;
    uncertain: number;
    uncertainShare: number;
  };
  coverage: { answered: string[]; missing: string[] };
  /** Which Sourced and Tested claims stand on good pages, and which on wrong, related or third-party ones. */
  claimQuality: ClaimQuality;
  /** How many of the golden pages the search found and the run read. */
  goldenPages: GoldenRecall;
};
