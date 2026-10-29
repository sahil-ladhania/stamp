/**
 * File: scorecard-sections.ts
 * Purpose: The scorecard's success-metric table and its list of things to check by hand.
 * Exports: metricRows, manualLines
 * Used by: evals/lib/scorecard.ts
 */
import { row } from "./format.js";
import { METRICS, formatMetric } from "./metrics.js";
import type { Summary } from "./summary.js";
import type { AppScore } from "./types.js";

export function metricRows(scores: readonly AppScore[], s: Summary): string[] {
  const set = scores.every((score) => score.set === scores[0]?.set)
    ? scores[0]?.set
    : undefined;
  return METRICS.map((metric) =>
    row([
      metric.name,
      metric.target({ set, apps: s.apps }),
      formatMetric(metric, metric.value(s), s),
    ]),
  );
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
