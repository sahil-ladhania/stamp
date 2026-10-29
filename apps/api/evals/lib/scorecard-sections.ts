/**
 * File: scorecard-sections.ts
 * Purpose: The scorecard's success-metric table and its list of things to check by hand.
 * Exports: metricRows, manualLines
 * Used by: evals/lib/scorecard.ts
 */
import { pct, row, usd } from "./format.js";
import { targetFor, type Summary } from "./summary.js";
import type { AppScore } from "./types.js";

export function metricRows(scores: readonly AppScore[], s: Summary): string[] {
  const set = scores.every((score) => score.set === scores[0]?.set)
    ? scores[0]?.set
    : undefined;
  const target = set ? targetFor(set, s.apps) : null;
  const atLeast = (n: number | null | undefined, of: number): string =>
    n === null || n === undefined
      ? "n/a for this selection"
      : `at least ${n} of ${of}`;
  return [
    row(["Wrong-product sources", "0", s.wrongProductSources]),
    row([
      "Sourced claims that contradict the golden set",
      "0",
      s.contradictions,
    ]),
    row([
      "Review gate correct",
      atLeast(target?.gate, s.apps),
      `${s.gateMatches} of ${s.apps}`,
    ]),
    row([
      "Apps with at least 2 real scopes",
      atLeast(target?.scopeApps, s.apps),
      `${s.appsWithTwoRealScopes} of ${s.apps}`,
    ]),
    row(["Fake or tutorial scopes", "0", s.fakeScopes]),
    row([
      "Milestone fields that are durations or Unknown",
      "100%",
      `${s.milestoneOk} of ${s.milestoneTotal}`,
    ]),
    row([
      "Top blocker is a setup or approval blocker",
      atLeast(target?.topBlocker, s.apps),
      `${s.topBlocker.pass} pass, ${s.topBlocker.manual} to check by hand`,
    ]),
    row([
      "Runs that end within 120 s",
      "100%",
      `${s.endedInTime} of ${s.apps}`,
    ]),
    row([
      "p95 run time",
      "at most 100 s",
      s.p95Seconds === null ? "n/a" : `${s.p95Seconds.toFixed(1)} s`,
    ]),
    row(["Uncertain share", "report", pct(s.meanUncertainShare)]),
    row(["Cost per run", "report", usd(s.meanCostUsd)]),
  ];
}

/** Things the rules cannot settle: each is a line to check by hand against the page. */
export function manualLines(scores: readonly AppScore[]): string[] {
  const lines: string[] = [];
  for (const score of scores) {
    const add = (what: string, items: readonly string[]): void => {
      if (items.length > 0)
        lines.push(`- ${score.slug}: ${what}: ${items.join(", ")}`);
    };
    if (score.topBlocker.verdict === "manual") {
      add("top blocker needs a check by hand", score.topBlocker.reasons);
    }
    add("scopes not in the golden list", score.scopes.unverified);
    add("related-product pages cited", score.sources.softProduct);
    add("official pages outside the golden path hints", score.sources.offHint);
    add("pages from other domains cited", score.sources.thirdParty);
  }
  return lines;
}
