/**
 * File: cost.ts
 * Purpose: Prices a run's token and Tavily usage from evals/pricing.json and estimates a batch before anything is run.
 * Exports: loadPricing, runCostUsd, estimateBatch, Pricing, BatchEstimate
 * Used by: evals/lib/run-batch.ts, evals/lib/plan-batch.ts
 */
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import type { UsageSummary } from "./types.js";

const Source = z.strictObject({
  url: z.string().url(),
  quote: z.string().min(1),
});
const UsageSchema = z.strictObject({
  fastCalls: z.number(),
  fastInputTokens: z.number(),
  fastOutputTokens: z.number(),
  strongCalls: z.number(),
  strongInputTokens: z.number(),
  strongOutputTokens: z.number(),
  totalTokens: z.number(),
  tavilySearchCalls: z.number(),
  tavilyExtractCalls: z.number(),
  tavilyCredits: z.number(),
  pagesFetched: z.number(),
  pageCacheHits: z.number(),
});

const PricingSchema = z.strictObject({
  asOf: z.string().min(1),
  models: z.record(
    z.string(),
    z.strictObject({
      inputPerMillionUsd: z.number().nonnegative(),
      outputPerMillionUsd: z.number().nonnegative(),
      source: Source,
    }),
  ),
  tavilyCreditUsd: z.strictObject({
    value: z.number().nonnegative(),
    source: Source,
  }),
  typicalRun: z.strictObject({ basis: z.string().min(1), usage: UsageSchema }),
  highFactor: z.number().min(1),
  notes: z.array(z.string()),
});
export type Pricing = z.infer<typeof PricingSchema>;

const PRICING_FILE = fileURLToPath(new URL("../pricing.json", import.meta.url));

/** Reads and validates evals/pricing.json. */
export async function loadPricing(): Promise<Pricing> {
  return PricingSchema.parse(JSON.parse(await readFile(PRICING_FILE, "utf8")));
}

type Models = { fast: string; strong: string };

/**
 * Dollars for one run's usage. Null when a tier that used tokens runs a model with no listed price:
 * the cost is unknown, never a guess.
 */
export function runCostUsd(
  usage: UsageSummary,
  models: Models,
  pricing: Pricing,
): number | null {
  let total = usage.tavilyCredits * pricing.tavilyCreditUsd.value;
  for (const tier of ["fast", "strong"] as const) {
    const tokensIn = usage[`${tier}InputTokens`];
    const tokensOut = usage[`${tier}OutputTokens`];
    if (tokensIn + tokensOut === 0) continue;
    const price = pricing.models[models[tier]];
    if (!price) return null;
    total +=
      (tokensIn * price.inputPerMillionUsd +
        tokensOut * price.outputPerMillionUsd) /
      1_000_000;
  }
  return total;
}

export type BatchEstimate = {
  runs: number;
  perRunUsd: number | null;
  totalUsd: number | null;
  highUsd: number | null;
  credits: number;
  highCredits: number;
  /** Models with no listed price; the dollar figures are null while this is not empty. */
  missingPrices: string[];
  basis: string;
};

/** The typical run times the number of runs, plus a high case; the basis says where the typical run came from. */
export function estimateBatch(
  runs: number,
  models: Models,
  pricing: Pricing,
): BatchEstimate {
  const typical = pricing.typicalRun.usage;
  const perRunUsd = runCostUsd(typical, models, pricing);
  const credits = typical.tavilyCredits * runs;
  const used = (["fast", "strong"] as const).map((tier) => models[tier]);
  const missing = [...new Set(used.filter((model) => !pricing.models[model]))];
  const totalUsd = perRunUsd === null ? null : perRunUsd * runs;
  return {
    runs,
    perRunUsd,
    totalUsd,
    highUsd: totalUsd === null ? null : totalUsd * pricing.highFactor,
    credits,
    highCredits: credits * pricing.highFactor,
    missingPrices: missing,
    basis: pricing.typicalRun.basis,
  };
}
