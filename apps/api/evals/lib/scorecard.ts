/**
 * File: scorecard.ts
 * Purpose: Renders scorecard.md: one row per app and one column per metric, a totals row, the success-metric table and what needs a manual look.
 * Exports: renderScorecard, ScorecardMeta
 * Used by: evals/lib/run-batch.ts
 */
import { COVERAGE_FIELDS } from "../scoring/coverage.js";
import { pct, row, usd } from "./format.js";
import { manualLines, metricRows } from "./scorecard-sections.js";
import { summarize, type Summary } from "./summary.js";
import type { AppScore } from "./types.js";

export type ScorecardMeta = {
  label: string;
  generatedAt: string;
  runDir: string;
};

const COLUMNS = [
  "App",
  "Status",
  "Time (s)",
  "In 120 s",
  "Pages",
  "Retries",
  "Wrong-product",
  "Gate",
  "Wait",
  "Real scopes",
  "Fake scopes",
  "Durations",
  "Top blocker",
  "Contradictions",
  "Coverage",
  "Uncertain",
  "Tokens",
  "Credits",
  "Cost",
];

const secs = (ms: number): string => (ms / 1000).toFixed(1);

/** "match (security_assessment)", "wrong (none)" or "unknown". */
const verdictCell = (verdict: string, found: string): string =>
  verdict === "unknown" ? "unknown" : `${verdict} (${found})`;

function appRow(score: AppScore): string {
  const status =
    score.status === "failed"
      ? `failed (${score.failureCode ?? "unknown"})`
      : score.status;
  const durations = score.durations;
  return row([
    score.slug,
    status,
    secs(score.durationMs),
    score.within120s ? "yes" : "no",
    score.pagesHeld,
    score.retries,
    score.sources.wrongProduct.length,
    verdictCell(score.gate.verdict, score.gate.found),
    verdictCell(score.wait.verdict, score.wait.found),
    `${score.scopes.real.length}/${score.scopes.total}`,
    score.scopes.fake.length,
    `${durations.ok + durations.unknown}/${durations.total}`,
    score.topBlocker.verdict,
    score.contradictions.length,
    `${score.coverage.answered.length}/${COVERAGE_FIELDS.length}`,
    pct(score.labels.uncertainShare),
    score.tokens,
    score.tavilyCredits,
    usd(score.costUsd),
  ]);
}

function totalsRow(scores: readonly AppScore[], s: Summary): string {
  const answered = scores.reduce(
    (total, score) => total + score.coverage.answered.length,
    0,
  );
  const { pass, manual, fail } = s.topBlocker;
  return row([
    "**Total**",
    `${s.apps - s.failed}/${s.apps} ended`,
    s.p95Seconds === null ? "n/a" : `p95 ${s.p95Seconds.toFixed(1)}`,
    `${s.endedInTime}/${s.apps}`,
    s.totalPages,
    s.totalRetries,
    s.wrongProductSources,
    `${s.gateMatches}/${s.apps} match`,
    `${s.waitMatches}/${s.apps} match`,
    `${s.appsWithTwoRealScopes}/${s.apps} apps with 2+`,
    s.fakeScopes,
    `${s.milestoneOk}/${s.milestoneTotal}`,
    `${pass} pass, ${manual} manual, ${fail} fail`,
    s.contradictions,
    `${answered}/${COVERAGE_FIELDS.length * s.apps}`,
    pct(s.meanUncertainShare),
    s.totalTokens,
    s.totalCredits,
    usd(s.totalCostUsd),
  ]);
}

/** The whole scorecard as markdown. */
export function renderScorecard(
  scores: readonly AppScore[],
  meta: ScorecardMeta,
): string {
  const s = summarize(scores);
  const manual = manualLines(scores);
  return [
    `# Scorecard: ${meta.label}`,
    "",
    `Generated ${meta.generatedAt}. Runs: ${s.apps}. Files: ${meta.runDir}`,
    "",
    row(COLUMNS),
    row(COLUMNS.map(() => "---")),
    ...scores.map(appRow),
    totalsRow(scores, s),
    "",
    "## Success metrics",
    "",
    row(["Metric", "Target", "Result"]),
    row(["---", "---", "---"]),
    ...metricRows(scores, s),
    "",
    "## Needs a manual look",
    "",
    ...(manual.length > 0 ? manual : ["Nothing flagged."]),
    "",
  ].join("\n");
}
