/**
 * File: score-app.ts
 * Purpose: Scores one captured run against its golden entry with the deterministic checks; every scorecard number comes from here.
 * Exports: scoreApp, WITHIN_BUDGET_MS
 * Used by: evals/lib/run-batch.ts
 */
import type { Claim, EvidenceLabel, Guide } from "@stamp/schema";
import { collectClaims, countLabels } from "../../src/agent/label-counts.js";
import type { Golden } from "../lib/golden.js";
import type { AppScore, GateCapture, RunCapture } from "../lib/types.js";
import { findContradictions } from "./contradictions.js";
import { scoreCoverage } from "./coverage.js";
import { durationShape } from "./duration.js";
import { describeWait, scoreGate, scoreWait } from "./gate.js";
import { classifyScope, scoreScopes } from "./scopes.js";
import { scoreSources } from "./sources.js";
import { scoreTopBlocker, type BlockerInput } from "./top-blocker.js";

/** The run budget the contract holds every run to. */
export const WITHIN_BUDGET_MS = 120_000;

const NO_GATES: GateCapture = {
  reviewGate: "unknown",
  reviewGateTier: null,
  approvalWait: "unknown",
  approvalWaitTier: null,
};

const MILESTONE_FIELDS = [
  ["firstTest", "effort"],
  ["firstTest", "wait"],
  ["production", "effort"],
  ["production", "wait"],
] as const;

/** Milestone effort and wait must be a duration or an honest unknown; the paths of any prose are listed. */
function scoreDurations(guide: Guide | null): AppScore["durations"] {
  const result = { total: 0, ok: 0, unknown: 0, prose: [] as string[] };
  if (!guide) return result;
  for (const [stage, field] of MILESTONE_FIELDS) {
    result.total += 1;
    const shape = durationShape(guide.milestones[stage][field].text);
    if (shape === "duration") result.ok += 1;
    else if (shape === "unknown") result.unknown += 1;
    else result.prose.push(`milestones.${stage}.${field}`);
  }
  return result;
}

/** The blocker the verdict points at, with its claims in the shape the relevance rules read. */
function topBlockerOf(guide: Guide | null): BlockerInput | null {
  const id = guide?.verdict.topBlockerId;
  const blocker = guide?.blockers.find((entry) => entry.id === id);
  if (!blocker) return null;
  return {
    id: blocker.id,
    claims: [blocker.symptom, blocker.cause, blocker.fix].map((claim) => ({
      label: claim.label,
      text: claim.text,
      sources: claim.sources.map(({ url, tier }) => ({ url, tier })),
    })),
  };
}

function statusOf(capture: RunCapture): AppScore["status"] {
  return capture.outcome.ok ? capture.outcome.status : "failed";
}

/** Scores one run. `costUsd` is null when a model price is unknown; a run that failed scores zero for everything that needs a guide. */
export function scoreApp(
  capture: RunCapture,
  golden: Golden,
  costUsd: number | null,
): AppScore {
  const { guide, usage } = capture;
  const gates = capture.gates ?? NO_GATES;
  const gateVerdict = scoreGate(gates.reviewGate, golden);
  const waitVerdict = scoreWait(gates.approvalWait, golden);
  // collectClaims finds claim-shaped objects anywhere in the guide, and the guide has passed GuideSchema.
  const claims = guide ? (collectClaims(guide) as Claim[]) : [];
  const cited = [
    ...claims.flatMap((claim) => claim.sources.map((source) => source.url)),
    ...(guide?.conflicts.flatMap((c) => [c.sourceA.url, c.sourceB.url]) ?? []),
  ];
  const scopeNames = guide?.scopes.map((scope) => scope.name) ?? [];
  const labels = countLabels(guide ?? []);
  const wrongProductOf = (urls: string[]): string[] =>
    scoreSources(urls, golden).wrongProduct;

  return {
    slug: golden.slug,
    set: golden.set,
    status: statusOf(capture),
    failureCode: capture.outcome.ok ? null : capture.outcome.code,
    durationMs: capture.durationMs,
    within120s: capture.outcome.ok && capture.durationMs <= WITHIN_BUDGET_MS,
    pagesHeld: capture.pages.length,
    pagesFetched: usage.pagesFetched,
    cacheHits: usage.pageCacheHits,
    retries: capture.retried ? 1 : 0,
    tokens: usage.totalTokens,
    tavilyCredits: usage.tavilyCredits,
    costUsd,
    sources: {
      ...scoreSources(cited, golden),
      heldWrongProduct: wrongProductOf(capture.pages.map((page) => page.url)),
    },
    gate: {
      found: gates.reviewGate,
      verdict: gateVerdict,
      tier: gates.reviewGateTier,
    },
    wait: { found: describeWait(gates.approvalWait), verdict: waitVerdict },
    scopes: scoreScopes(scopeNames, golden),
    durations: scoreDurations(guide),
    topBlocker: scoreTopBlocker(topBlockerOf(guide), golden),
    contradictions: findContradictions({
      gate: { found: gates.reviewGate, verdict: gateVerdict },
      wait: { found: describeWait(gates.approvalWait), verdict: waitVerdict },
      scopes: (guide?.scopes ?? []).map((scope) => ({
        name: scope.name,
        kind: classifyScope(scope.name, golden),
        label: scope.reason.label,
      })),
      claims: claims.map((claim) => ({
        label: claim.label as EvidenceLabel,
        wrongProductUrls: wrongProductOf(claim.sources.map((s) => s.url)),
      })),
    }),
    labels: {
      ...labels,
      uncertainShare:
        labels.claims === 0 ? 0 : labels.uncertain / labels.claims,
    },
    coverage: scoreCoverage({
      gate: gates.reviewGate,
      wait: gates.approvalWait,
      guide,
    }),
  };
}
