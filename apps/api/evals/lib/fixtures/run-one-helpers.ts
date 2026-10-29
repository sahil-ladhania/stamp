/**
 * File: run-one-helpers.ts
 * Purpose: Shared setup for the runOne tests: the gmail golden entry, model names, a log tap on a fake stream and a run summary line.
 * Exports: gmailGolden, MODELS, setup, SUMMARY
 * Used by: evals/lib/run-one.test.ts, evals/lib/run-one-failures.test.ts
 */
import { loadGolden } from "../golden.js";
import { tapLogs, type TappableStream } from "../log-tap.js";

export const gmailGolden = (await loadGolden()).find(
  (g) => g.slug === "gmail",
)!;
export const MODELS = { fast: "gpt-4.1-mini", strong: "gpt-4.1" };

export function setup() {
  const stream: TappableStream = { write: () => true };
  const tap = tapLogs([stream]);
  const log = (fields: Record<string, unknown>) =>
    stream.write(`${JSON.stringify(fields)}\n`);
  return { tap, log };
}

export const SUMMARY = {
  message: "run summary",
  durationMs: 41_000,
  stageReached: 8,
  fastCalls: 1,
  fastInputTokens: 300,
  fastOutputTokens: 50,
  strongCalls: 9,
  strongInputTokens: 30_000,
  strongOutputTokens: 1_500,
  totalTokens: 31_850,
  tavilySearchCalls: 10,
  tavilyExtractCalls: 2,
  tavilyCredits: 11,
  pagesFetched: 6,
  pageCacheHits: 0,
};
