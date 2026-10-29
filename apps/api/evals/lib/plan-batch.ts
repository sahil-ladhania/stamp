/**
 * File: plan-batch.ts
 * Purpose: Plans a batch before anything runs: picks the apps, enforces the 12-run limit and the holdout guard, and writes the cost estimate the owner must confirm.
 * Exports: planBatch, BatchPlan
 * Used by: evals/cli.ts
 */
import { estimateBatch, type BatchEstimate, type Pricing } from "./cost.js";
import { MAX_RUNS_PER_BATCH, type CliArgs } from "./cli-args.js";
import type { CreditsUsed } from "./credits-used.js";
import { selectGolden, type Golden } from "./golden.js";

export type BatchPlan = {
  goldens: Golden[];
  estimate: BatchEstimate;
  /** What to print before asking for --confirm. */
  lines: string[];
};

const usd = (value: number): string => `$${value.toFixed(2)}`;

function estimateLine(estimate: BatchEstimate): string {
  const credits = `${estimate.credits} Tavily credits (up to ${estimate.highCredits})`;
  if (estimate.totalUsd === null || estimate.highUsd === null) {
    return `Estimate: dollars unknown: no price for ${estimate.missingPrices.join(", ")} in evals/pricing.json; ${credits}.`;
  }
  return `Estimate: about ${usd(estimate.totalUsd)} (up to ${usd(estimate.highUsd)} if runs cost double), ${credits}.`;
}

function runsLine(apps: number, args: CliArgs): string {
  if (args.repeat === 1) {
    return `Runs: ${apps} (at most ${MAX_RUNS_PER_BATCH} per batch), ${args.parallel} at a time`;
  }
  return `Runs: ${apps} per repetition, ${args.repeat} repetitions = ${apps * args.repeat} (at most ${MAX_RUNS_PER_BATCH} per repetition), ${args.parallel} at a time`;
}

/** What the evals have used so far, this batch, and the running total, so the owner can keep credits back. */
function creditsLine(used: CreditsUsed, estimate: BatchEstimate): string {
  return `Credits used by evals so far: ${used.credits} in ${used.runs} runs (about ${usd(used.usd)}). This batch: ${estimate.credits} (up to ${estimate.highCredits}). Running total after it: ${used.credits + estimate.credits} (up to ${used.credits + estimate.highCredits}).`;
}

function priceSources(models: readonly string[], pricing: Pricing): string {
  const urls = models.flatMap(
    (model) => pricing.models[model]?.source.url ?? [],
  );
  return [...new Set([...urls, pricing.tavilyCreditUsd.source.url])].join(", ");
}

/**
 * Throws, with a plain message, for a selection the rules do not allow. The holdout set needs --allow-holdout
 * so that it is only ever run on purpose, once, after the last fix.
 */
export function planBatch(
  args: CliArgs,
  all: readonly Golden[],
  pricing: Pricing,
  models: { fast: string; strong: string },
  used: CreditsUsed = { credits: 0, runs: 0, usd: 0 },
): BatchPlan {
  const goldens = selectGolden(all, args.selector);
  if (goldens.length > MAX_RUNS_PER_BATCH) {
    throw new Error(
      `A batch is at most ${MAX_RUNS_PER_BATCH} runs; this one would run ${goldens.length}.`,
    );
  }
  const holdout = goldens.some((golden) => golden.set === "holdout");
  if (holdout && !args.allowHoldout) {
    throw new Error(
      "The holdout set needs --allow-holdout. Run it once, after the last fix, and never tune on its results.",
    );
  }
  if (holdout && args.repeat > 1) {
    throw new Error(
      "The holdout set is run once: --repeat is not allowed for it.",
    );
  }
  const runs = goldens.length * args.repeat;
  const estimate = estimateBatch(runs, models, pricing);
  const lines = [
    `Eval batch: ${args.selector}${holdout ? " (HOLDOUT: run once, do not tune on it)" : ""}`,
    `Apps: ${goldens.map((golden) => golden.slug).join(", ")}`,
    runsLine(goldens.length, args),
    `Models: fast ${models.fast}, strong ${models.strong}`,
    estimateLine(estimate),
    creditsLine(used, estimate),
    `Basis: ${estimate.basis}`,
    `Prices as of ${pricing.asOf}: ${priceSources([models.fast, models.strong], pricing)}`,
    "Every run fetches its pages fresh (the page cache is not used) and no guide is saved to the database.",
  ];
  return { goldens, estimate, lines };
}
