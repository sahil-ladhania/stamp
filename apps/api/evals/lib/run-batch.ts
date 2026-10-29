/**
 * File: run-batch.ts
 * Purpose: Runs a batch of golden apps (at most the parallel limit at once), scores each run and writes its guide, trace, score, meta.json and scorecard.md.
 * Exports: runBatch, BatchOptions, BatchResult
 * Used by: evals/cli.ts
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { mapLimit } from "../../src/utils/map-limit.js";
import { scoreApp } from "../scoring/score-app.js";
import { runCostUsd, type Pricing } from "./cost.js";
import type { Golden } from "./golden.js";
import { renderScorecard } from "./scorecard.js";
import type { AppScore, RunCapture } from "./types.js";

export type BatchOptions = {
  goldens: readonly Golden[];
  parallel: number;
  outDir: string;
  pricing: Pricing;
  /** The title of the scorecard: the set or app that was selected. */
  label: string;
  run: (golden: Golden) => Promise<RunCapture>;
  now?: () => Date;
  log?: (line: string) => void;
};

export type BatchResult = { scores: AppScore[]; scorecardPath: string };

const json = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;

/** The capture without the three big parts that have their own files. */
function runSummary(
  capture: RunCapture,
): Omit<RunCapture, "guide" | "events" | "logs"> {
  const { guide: _guide, events: _events, logs: _logs, ...rest } = capture;
  return rest;
}

async function writeRunFiles(
  outDir: string,
  capture: RunCapture,
  score: AppScore,
): Promise<void> {
  const base = join(outDir, capture.slug);
  await Promise.all([
    writeFile(`${base}.guide.json`, json(capture.guide)),
    writeFile(
      `${base}.trace.json`,
      json({ events: capture.events, logs: capture.logs }),
    ),
    writeFile(`${base}.score.json`, json({ score, run: runSummary(capture) })),
  ]);
}

/** Runs every golden app, in order of the list, with `parallel` at a time. A thrown error stops the batch; files already written stay. */
export async function runBatch(options: BatchOptions): Promise<BatchResult> {
  const now = options.now ?? (() => new Date());
  const log = options.log ?? (() => {});
  const startedAt = now();
  await mkdir(options.outDir, { recursive: true });

  const scores = await mapLimit(
    options.goldens,
    options.parallel,
    async (golden) => {
      log(`${golden.slug}: started`);
      const capture = await options.run(golden);
      const cost = runCostUsd(capture.usage, capture.models, options.pricing);
      const score = scoreApp({ ...capture, slug: golden.slug }, golden, cost);
      await writeRunFiles(
        options.outDir,
        { ...capture, slug: golden.slug },
        score,
      );
      log(
        `${golden.slug}: ${score.status}${score.failureCode ? ` (${score.failureCode})` : ""} in ${(score.durationMs / 1000).toFixed(1)} s, ${score.tavilyCredits} credits`,
      );
      return score;
    },
  );

  const finishedAt = now();
  const scorecardPath = join(options.outDir, "scorecard.md");
  await Promise.all([
    writeFile(
      scorecardPath,
      renderScorecard(scores, {
        label: options.label,
        generatedAt: finishedAt.toISOString(),
        runDir: options.outDir,
      }),
    ),
    writeFile(
      join(options.outDir, "meta.json"),
      json({
        label: options.label,
        apps: options.goldens.map((golden) => golden.slug),
        parallel: options.parallel,
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        pricingAsOf: options.pricing.asOf,
      }),
    ),
  ]);
  return { scores, scorecardPath };
}
