/**
 * File: metrics.ts
 * Purpose: The success metrics as data: name, target for a selection, how to read each from a summary and how a value prints. One list feeds both the single-run and the repeat tables.
 * Exports: METRICS, formatMetric, Metric, MetricContext
 * Used by: evals/lib/scorecard-sections.ts, evals/lib/scorecard-repeat.ts
 */
import { targetFor, type Summary } from "./summary.js";

export type MetricContext = {
  set: "tuning" | "holdout" | "fresh" | undefined;
  apps: number;
};

type Unit = "count" | "percent" | "seconds" | "usd";

export type Metric = {
  name: string;
  unit: Unit;
  target: (context: MetricContext) => string;
  value: (summary: Summary) => number | null;
  /** The number the count is "of", when there is one. */
  total?: (summary: Summary) => number;
};

const fixed = (text: string) => () => text;

/** "at least 5 of 6" for a full set, or a note that a count target does not apply. */
function atLeast(
  pick: (t: NonNullable<ReturnType<typeof targetFor>>) => number | null,
) {
  return ({ set, apps }: MetricContext): string => {
    const target = set ? targetFor(set, apps) : null;
    const n = target ? pick(target) : null;
    return n === null ? "n/a for this selection" : `at least ${n} of ${apps}`;
  };
}

export const METRICS: readonly Metric[] = [
  {
    name: "Wrong-product sources",
    unit: "count",
    target: fixed("0"),
    value: (s) => s.wrongProductSources,
  },
  {
    name: "Sourced claims that contradict the golden set",
    unit: "count",
    target: fixed("0"),
    value: (s) => s.contradictions,
  },
  {
    name: "Review gate correct",
    unit: "count",
    target: atLeast((t) => t.gate),
    value: (s) => s.gateMatches,
    total: (s) => s.apps,
  },
  {
    name: "Apps with at least 2 real scopes",
    unit: "count",
    target: atLeast((t) => t.scopeApps),
    value: (s) => s.appsWithTwoRealScopes,
    total: (s) => s.apps,
  },
  {
    name: "Fake or tutorial scopes",
    unit: "count",
    target: fixed("0"),
    value: (s) => s.fakeScopes,
  },
  {
    name: "Milestone fields that are durations or Unknown",
    unit: "count",
    target: fixed("100%"),
    value: (s) => s.milestoneOk,
    total: (s) => s.milestoneTotal,
  },
  {
    name: "Top blocker is a setup or approval blocker",
    unit: "count",
    target: atLeast((t) => t.topBlocker),
    value: (s) => s.topBlocker.pass,
    total: (s) => s.apps,
  },
  {
    name: "Runs that end within 120 s",
    unit: "count",
    target: fixed("100%"),
    value: (s) => s.endedInTime,
    total: (s) => s.apps,
  },
  {
    name: "p95 run time",
    unit: "seconds",
    target: fixed("at most 100 s"),
    value: (s) => s.p95Seconds,
  },
  {
    name: "Uncertain share",
    unit: "percent",
    target: fixed("report"),
    value: (s) => s.meanUncertainShare,
  },
  {
    name: "Cost per run",
    unit: "usd",
    target: fixed("report"),
    value: (s) => s.meanCostUsd,
  },
  {
    name: "Sourced claims on good pages",
    unit: "percent",
    target: fixed("report (stage 3 target: at least 95%)"),
    value: (s) => s.goodShare,
  },
  {
    name: "Golden pages read",
    unit: "count",
    target: fixed("report"),
    value: (s) => s.goldenFetched,
    total: (s) => s.goldenTotal,
  },
  {
    name: "Golden pages found by the search",
    unit: "count",
    target: fixed("report"),
    value: (s) => s.goldenInResults,
    total: (s) => s.goldenTotal,
  },
];

const plainNumber = (value: number): string =>
  Number.isInteger(value) ? String(value) : value.toFixed(1);

/** One value as a table cell. A count reads "2 of 6" unless `withTotal` is false; a null reads "n/a". */
export function formatMetric(
  metric: Metric,
  value: number | null,
  summary: Summary,
  options: { withTotal?: boolean } = {},
): string {
  if (value === null) return "n/a";
  switch (metric.unit) {
    case "percent":
      return `${Math.round(value * 100)}%`;
    case "seconds":
      return `${value.toFixed(1)} s`;
    case "usd":
      return `$${value.toFixed(2)}`;
    case "count":
      return metric.total && options.withTotal !== false
        ? `${plainNumber(value)} of ${metric.total(summary)}`
        : plainNumber(value);
  }
}
