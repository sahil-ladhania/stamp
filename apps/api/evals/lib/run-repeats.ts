/**
 * File: run-repeats.ts
 * Purpose: Runs a selection once, or several times one after another, each repetition into its own folder, and writes the combined scorecard.
 * Exports: runRepeats, RepeatOptions, RepeatResult
 * Used by: evals/cli.ts
 */
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { runBatch, type BatchOptions } from "./run-batch.js";
import { renderRepeatScorecard } from "./scorecard-repeat.js";
import type { AppScore } from "./types.js";

export type RepeatOptions = BatchOptions & { repeat: number };
export type RepeatResult = { reps: AppScore[][]; scorecardPath: string };

/**
 * One repetition is a plain batch in the folder itself. Several go to rep-1, rep-2 and so on, never at
 * the same time, so the parallel limit still holds; the folder gets the combined scorecard and meta.json.
 */
export async function runRepeats(
  options: RepeatOptions,
): Promise<RepeatResult> {
  if (options.repeat === 1) {
    const only = await runBatch(options);
    return { reps: [only.scores], scorecardPath: only.scorecardPath };
  }
  const now = options.now ?? (() => new Date());
  const log = options.log ?? (() => {});
  const startedAt = now();
  const reps: AppScore[][] = [];
  for (let index = 1; index <= options.repeat; index += 1) {
    const result = await runBatch({
      ...options,
      outDir: join(options.outDir, `rep-${index}`),
      label: `${options.label}, repetition ${index} of ${options.repeat}`,
      log: (line) => log(`[${index}/${options.repeat}] ${line}`),
    });
    reps.push(result.scores);
  }
  const finishedAt = now();
  const scorecardPath = join(options.outDir, "scorecard.md");
  await Promise.all([
    writeFile(
      scorecardPath,
      renderRepeatScorecard(reps, {
        label: options.label,
        generatedAt: finishedAt.toISOString(),
        runDir: options.outDir,
      }),
    ),
    writeFile(
      join(options.outDir, "meta.json"),
      `${JSON.stringify(
        {
          label: options.label,
          repeat: options.repeat,
          apps: options.goldens.map((golden) => golden.slug),
          parallel: options.parallel,
          startedAt: startedAt.toISOString(),
          finishedAt: finishedAt.toISOString(),
          pricingAsOf: options.pricing.asOf,
        },
        null,
        2,
      )}\n`,
    ),
  ]);
  return { reps, scorecardPath };
}
