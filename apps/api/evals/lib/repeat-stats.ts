/**
 * File: repeat-stats.ts
 * Purpose: Statistics over repetitions of the same batch: the mean and range of each success metric, and the verdicts that changed between repetitions.
 * Exports: stat, metricStats, verdictFlips, Stat, MetricStat, Flip
 * Used by: evals/lib/scorecard-repeat.ts
 */
import { METRICS, type Metric } from "./metrics.js";
import { summarize, type Summary } from "./summary.js";
import type { AppScore } from "./types.js";

export type Stat = { mean: number; min: number; max: number };

/** Mean, lowest and highest of at least one value. */
export function stat(values: readonly number[]): Stat {
  const total = values.reduce((sum, value) => sum + value, 0);
  return {
    mean: total / values.length,
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

export type MetricStat = {
  metric: Metric;
  /** Null when the metric is unknown in any repetition, for example a cost with no price. */
  stat: Stat | null;
  /** The first repetition's summary, for the totals a count is "of". */
  summary: Summary;
};

/** Each success metric over the repetitions, read from each repetition's own summary. */
export function metricStats(
  reps: readonly (readonly AppScore[])[],
): MetricStat[] {
  const summaries = reps.map((scores) => summarize(scores));
  return METRICS.map((metric) => {
    const values = summaries.map((summary) => metric.value(summary));
    const known = values.filter((value): value is number => value !== null);
    return {
      metric,
      stat:
        known.length === values.length && known.length > 0 ? stat(known) : null,
      summary: summaries[0] ?? summarize([]),
    };
  });
}

const FLIP_FIELDS: { name: string; read: (score: AppScore) => string }[] = [
  { name: "review gate", read: (score) => score.gate.verdict },
  { name: "approval wait", read: (score) => score.wait.verdict },
  { name: "top blocker", read: (score) => score.topBlocker.verdict },
  { name: "status", read: (score) => score.status },
];

export type Flip = { app: string; field: string; values: string[] };

/**
 * Every verdict (gate, wait, top blocker, status) is a cell for each app. A cell flips when its value
 * is not the same in every repetition; an app a repetition did not run counts as "missing".
 */
export function verdictFlips(reps: readonly (readonly AppScore[])[]): {
  flips: Flip[];
  cells: number;
} {
  const apps = [...new Set(reps.flatMap((rep) => rep.map((s) => s.slug)))];
  const flips: Flip[] = [];
  for (const app of apps) {
    for (const field of FLIP_FIELDS) {
      const values = reps.map((rep) => {
        const score = rep.find((entry) => entry.slug === app);
        return score ? field.read(score) : "missing";
      });
      if (new Set(values).size > 1) {
        flips.push({ app, field: field.name, values });
      }
    }
  }
  return { flips, cells: apps.length * FLIP_FIELDS.length };
}
