/**
 * File: usage.ts
 * Purpose: Per-run cost counters (model tokens, Tavily calls and credits, pages) kept as plain data for logs.
 * Exports: createRunUsage, recordModelCall, recordTavilyCall, recordPages, summarizeUsage, ZERO_TOKENS, RunUsage, TokenUsage, ModelTier
 * Used by: lib/openai.ts, lib/tavily.ts, agent run (later)
 */

export type ModelTier = "fast" | "strong";

export type TokenUsage = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
};

export type RunUsage = {
  models: Record<ModelTier, TokenUsage & { calls: number }>;
  tavily: { searchCalls: number; extractCalls: number; credits: number };
  pages: { fetched: number; cacheHits: number };
};

export const ZERO_TOKENS: TokenUsage = {
  inputTokens: 0,
  outputTokens: 0,
  totalTokens: 0,
};

/** Fresh counters for one run; callers pass the same object to every client call. */
export function createRunUsage(): RunUsage {
  return {
    models: {
      fast: { ...ZERO_TOKENS, calls: 0 },
      strong: { ...ZERO_TOKENS, calls: 0 },
    },
    tavily: { searchCalls: 0, extractCalls: 0, credits: 0 },
    pages: { fetched: 0, cacheHits: 0 },
  };
}

/** Adds one model call; a call that failed to parse still cost tokens, so it is recorded too. */
export function recordModelCall(
  usage: RunUsage,
  tier: ModelTier,
  tokens: TokenUsage,
): void {
  const bucket = usage.models[tier];
  bucket.calls += 1;
  bucket.inputTokens += tokens.inputTokens;
  bucket.outputTokens += tokens.outputTokens;
  bucket.totalTokens += tokens.totalTokens;
}

/** Adds one Tavily request; `credits` is null when the API did not report usage. */
export function recordTavilyCall(
  usage: RunUsage,
  kind: "search" | "extract",
  credits: number | null,
): void {
  if (kind === "search") {
    usage.tavily.searchCalls += 1;
  } else {
    usage.tavily.extractCalls += 1;
  }
  usage.tavily.credits += credits ?? 0;
}

/** Adds pages fetched from the network and pages served from the page cache. */
export function recordPages(
  usage: RunUsage,
  counts: { fetched?: number; cacheHits?: number },
): void {
  usage.pages.fetched += counts.fetched ?? 0;
  usage.pages.cacheHits += counts.cacheHits ?? 0;
}

/** One flat object of numbers for a single structured log line. */
export function summarizeUsage(usage: RunUsage): Record<string, number> {
  const { fast, strong } = usage.models;
  return {
    fastCalls: fast.calls,
    fastInputTokens: fast.inputTokens,
    fastOutputTokens: fast.outputTokens,
    strongCalls: strong.calls,
    strongInputTokens: strong.inputTokens,
    strongOutputTokens: strong.outputTokens,
    totalTokens: fast.totalTokens + strong.totalTokens,
    tavilySearchCalls: usage.tavily.searchCalls,
    tavilyExtractCalls: usage.tavily.extractCalls,
    tavilyCredits: usage.tavily.credits,
    pagesFetched: usage.pages.fetched,
    pageCacheHits: usage.pages.cacheHits,
  };
}
