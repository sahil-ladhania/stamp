/**
 * File: scorecard-repeat.ts
 * Purpose: Renders the scorecard over several repetitions: each success metric as a mean with its range, each app's verdicts per repetition, and how many verdicts varied.
 * Exports: renderRepeatScorecard
 * Used by: evals/lib/run-repeats.ts, evals/lib/rescore.ts
 */
import { row } from "./format.js";
import { formatMetric } from "./metrics.js";
import {
  metricStats,
  verdictFlips,
  type Flip,
  type MetricStat,
} from "./repeat-stats.js";
import type { ScorecardMeta } from "./scorecard.js";
import type { AppScore } from "./types.js";

const FIELDS: { title: string; name: string }[] = [
  { title: "Review gate", name: "review gate" },
  { title: "Approval wait", name: "approval wait" },
  { title: "Top blocker", name: "top blocker" },
  { title: "Status", name: "status" },
];

function metricLine(
  entry: MetricStat,
  set: AppScore["set"] | undefined,
  apps: number,
): string {
  const { metric, stat, summary } = entry;
  const cell = stat
    ? `${formatMetric(metric, stat.mean, summary)} (${formatMetric(metric, stat.min, summary, { withTotal: false })} to ${formatMetric(metric, stat.max, summary, { withTotal: false })})`
    : "n/a";
  return row([metric.name, metric.target({ set, apps }), cell]);
}

function valueOf(score: AppScore, field: string): string {
  if (field === "review gate") return score.gate.verdict;
  if (field === "approval wait") return score.wait.verdict;
  if (field === "top blocker") return score.topBlocker.verdict;
  return score.status;
}

/** The verdicts of one app, one cell per field. A verdict that varied lists its value in each repetition. */
function verdictRow(
  app: string,
  flips: readonly Flip[],
  reps: readonly (readonly AppScore[])[],
): string {
  const cells = FIELDS.map(({ name }) => {
    const flip = flips.find(
      (entry) => entry.app === app && entry.field === name,
    );
    if (flip) return `${flip.values.join(", ")} (varies)`;
    const score = reps[0]?.find((entry) => entry.slug === app);
    return score ? valueOf(score, name) : "missing";
  });
  return row([app, ...cells]);
}

/** The scorecard over `reps`, one list of app scores per repetition. */
export function renderRepeatScorecard(
  reps: readonly (readonly AppScore[])[],
  meta: ScorecardMeta,
): string {
  const first = reps[0] ?? [];
  const set = first.every((score) => score.set === first[0]?.set)
    ? first[0]?.set
    : undefined;
  const { flips, cells } = verdictFlips(reps);
  const apps = [
    ...new Set(reps.flatMap((rep) => rep.map((score) => score.slug))),
  ];
  return [
    `# Scorecard: ${meta.label}, ${reps.length} repetitions`,
    "",
    `Generated ${meta.generatedAt}. Files: ${meta.runDir}`,
    "",
    "Each metric is the mean over the repetitions, with the lowest to highest in brackets. A target of zero has to hold in every repetition, so read the highest value.",
    "",
    "## Success metrics",
    "",
    row(["Metric", "Target", "Mean (lowest to highest)"]),
    row(["---", "---", "---"]),
    ...metricStats(reps).map((entry) => metricLine(entry, set, first.length)),
    "",
    "## Verdicts per repetition",
    "",
    row(["App", ...FIELDS.map((field) => field.title)]),
    row(["---", ...FIELDS.map(() => "---")]),
    ...apps.map((app) => verdictRow(app, flips, reps)),
    "",
    `${flips.length} of ${cells} verdicts differed between repetitions.`,
    "",
    "## Each repetition",
    "",
    ...reps.map((_, index) => `- rep-${index + 1}/scorecard.md`),
    "",
  ].join("\n");
}
