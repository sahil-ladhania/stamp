/**
 * File: usage.test.ts
 * Purpose: Tests the per-run usage counters and their flat log summary.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import {
  createRunUsage,
  recordModelCall,
  recordPages,
  recordTavilyCall,
  summarizeUsage,
} from "./usage.js";

describe("createRunUsage", () => {
  it("starts at zero", () => {
    expect(summarizeUsage(createRunUsage())).toEqual({
      fastCalls: 0,
      fastInputTokens: 0,
      fastOutputTokens: 0,
      strongCalls: 0,
      strongInputTokens: 0,
      strongOutputTokens: 0,
      totalTokens: 0,
      tavilySearchCalls: 0,
      tavilyExtractCalls: 0,
      tavilyCredits: 0,
      pagesFetched: 0,
      pageCacheHits: 0,
    });
  });

  it("gives each run its own counters", () => {
    const a = createRunUsage();
    const b = createRunUsage();
    recordModelCall(a, "fast", {
      inputTokens: 5,
      outputTokens: 1,
      totalTokens: 6,
    });
    expect(b.models.fast.calls).toBe(0);
  });
});

describe("recordModelCall", () => {
  it("accumulates calls and tokens per tier", () => {
    const usage = createRunUsage();
    recordModelCall(usage, "fast", {
      inputTokens: 100,
      outputTokens: 20,
      totalTokens: 120,
    });
    recordModelCall(usage, "strong", {
      inputTokens: 1000,
      outputTokens: 300,
      totalTokens: 1300,
    });
    recordModelCall(usage, "strong", {
      inputTokens: 500,
      outputTokens: 50,
      totalTokens: 550,
    });
    expect(usage.models.fast).toEqual({
      calls: 1,
      inputTokens: 100,
      outputTokens: 20,
      totalTokens: 120,
    });
    expect(usage.models.strong).toEqual({
      calls: 2,
      inputTokens: 1500,
      outputTokens: 350,
      totalTokens: 1850,
    });
  });
});

describe("recordTavilyCall", () => {
  it("counts searches and extractions separately and adds credits", () => {
    const usage = createRunUsage();
    recordTavilyCall(usage, "search", 1);
    recordTavilyCall(usage, "search", 1);
    recordTavilyCall(usage, "extract", 2);
    expect(usage.tavily).toEqual({
      searchCalls: 2,
      extractCalls: 1,
      credits: 4,
    });
  });

  it("still counts a call whose credits were not reported", () => {
    const usage = createRunUsage();
    recordTavilyCall(usage, "extract", null);
    expect(usage.tavily).toEqual({
      searchCalls: 0,
      extractCalls: 1,
      credits: 0,
    });
  });
});

describe("recordPages and summarizeUsage", () => {
  it("adds fetched pages and cache hits", () => {
    const usage = createRunUsage();
    recordPages(usage, { fetched: 3 });
    recordPages(usage, { cacheHits: 2 });
    recordPages(usage, { fetched: 1, cacheHits: 1 });
    expect(usage.pages).toEqual({ fetched: 4, cacheHits: 3 });
  });

  it("summarises everything as one flat object of numbers with the combined token total", () => {
    const usage = createRunUsage();
    recordModelCall(usage, "fast", {
      inputTokens: 10,
      outputTokens: 5,
      totalTokens: 15,
    });
    recordModelCall(usage, "strong", {
      inputTokens: 90,
      outputTokens: 10,
      totalTokens: 100,
    });
    recordTavilyCall(usage, "search", 1);
    recordPages(usage, { fetched: 2, cacheHits: 1 });
    const summary = summarizeUsage(usage);
    expect(summary).toMatchObject({
      fastCalls: 1,
      strongCalls: 1,
      totalTokens: 115,
      tavilySearchCalls: 1,
      tavilyCredits: 1,
      pagesFetched: 2,
      pageCacheHits: 1,
    });
    expect(
      Object.values(summary).every((value) => typeof value === "number"),
    ).toBe(true);
  });
});
