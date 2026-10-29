/**
 * File: summary.ts
 * Purpose: Rolls per-app scores up into the success-metric numbers and the contract targets for each set.
 * Exports: summarize, percentile, targetFor, Summary
 * Used by: evals/lib/scorecard.ts, evals/lib/run-batch.ts
 */
import type { AppScore } from "./types.js";

export type Summary = {
  apps: number;
  failed: number;
  endedInTime: number;
  p95Seconds: number | null;
  wrongProductSources: number;
  contradictions: number;
  gateMatches: number;
  waitMatches: number;
  appsWithTwoRealScopes: number;
  fakeScopes: number;
  milestoneOk: number;
  milestoneTotal: number;
  topBlocker: { pass: number; fail: number; manual: number; none: number };
  meanUncertainShare: number;
  totalCostUsd: number | null;
  meanCostUsd: number | null;
  totalCredits: number;
  totalTokens: number;
  totalPages: number;
  totalRetries: number;
};

const sum = (values: readonly number[]): number =>
  values.reduce((total, value) => total + value, 0);

/** Nearest-rank percentile of a list; null when the list is empty. */
export function percentile(
  values: readonly number[],
  p: number,
): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.ceil((p / 100) * sorted.length);
  return sorted[Math.max(0, rank - 1)] ?? null;
}

/** Cost is a total only when every run's cost is known; one unknown price makes the total unknown. */
function totalCost(scores: readonly AppScore[]): number | null {
  const costs = scores.map((score) => score.costUsd);
  return costs.every((cost): cost is number => cost !== null)
    ? sum(costs)
    : null;
}

export function summarize(scores: readonly AppScore[]): Summary {
  const topBlocker = { pass: 0, fail: 0, manual: 0, none: 0 };
  for (const score of scores) topBlocker[score.topBlocker.verdict] += 1;
  const total = totalCost(scores);
  const p95 = percentile(
    scores.map((score) => score.durationMs),
    95,
  );
  return {
    apps: scores.length,
    failed: scores.filter((score) => score.status === "failed").length,
    endedInTime: scores.filter((score) => score.within120s).length,
    p95Seconds: p95 === null ? null : p95 / 1000,
    wrongProductSources: sum(scores.map((s) => s.sources.wrongProduct.length)),
    contradictions: sum(scores.map((s) => s.contradictions.length)),
    gateMatches: scores.filter((s) => s.gate.verdict === "match").length,
    waitMatches: scores.filter((s) => s.wait.verdict === "match").length,
    appsWithTwoRealScopes: scores.filter((s) => s.scopes.real.length >= 2)
      .length,
    fakeScopes: sum(scores.map((s) => s.scopes.fake.length)),
    milestoneOk: sum(scores.map((s) => s.durations.ok + s.durations.unknown)),
    milestoneTotal: sum(scores.map((s) => s.durations.total)),
    topBlocker,
    meanUncertainShare:
      scores.length === 0
        ? 0
        : sum(scores.map((s) => s.labels.uncertainShare)) / scores.length,
    totalCostUsd: total,
    meanCostUsd:
      total === null || scores.length === 0 ? null : total / scores.length,
    totalCredits: sum(scores.map((s) => s.tavilyCredits)),
    totalTokens: sum(scores.map((s) => s.tokens)),
    totalPages: sum(scores.map((s) => s.pagesHeld)),
    totalRetries: sum(scores.map((s) => s.retries)),
  };
}

/**
 * The contract's pass counts: gate 5 of 6 tuning and 3 of 4 holdout, real scopes and top blocker 5 of 6
 * on tuning only. Null for a single app or a partial set, where a count target means nothing.
 */
export function targetFor(
  set: "tuning" | "holdout",
  apps: number,
): {
  gate: number;
  scopeApps: number | null;
  topBlocker: number | null;
} | null {
  if (set === "tuning" && apps === 6)
    return { gate: 5, scopeApps: 5, topBlocker: 5 };
  if (set === "holdout" && apps === 4)
    return { gate: 3, scopeApps: null, topBlocker: null };
  return null;
}
