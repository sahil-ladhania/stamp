/**
 * File: cost.test.ts
 * Purpose: Tests the pricing file, the cost of one run's usage and the cost estimate for a batch.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { estimateBatch, loadPricing, runCostUsd } from "./cost.js";
import { emptyUsage } from "./types.js";

const pricing = await loadPricing();
const MODELS = { fast: "gpt-4.1-mini", strong: "gpt-4.1" };

describe("loadPricing", () => {
  it("reads prices that carry an official source for each model and for Tavily", () => {
    expect(Object.keys(pricing.models)).toEqual(["gpt-4.1", "gpt-4.1-mini"]);
    expect(pricing.tavilyCreditUsd.source.url).toMatch(
      /^https:\/\/docs\.tavily\.com\//,
    );
    for (const model of Object.values(pricing.models)) {
      expect(model.source.url).toMatch(/^https:\/\/developers\.openai\.com\//);
    }
  });
});

describe("runCostUsd", () => {
  it("prices tokens per million and Tavily credits per credit", () => {
    const usage = {
      ...emptyUsage(),
      strongInputTokens: 1_000_000,
      strongOutputTokens: 500_000,
      tavilyCredits: 10,
    };
    // 1M x $2 + 0.5M x $8 + 10 credits x $0.008
    expect(runCostUsd(usage, MODELS, pricing)).toBeCloseTo(6.08, 6);
  });

  it("prices the fast tier with its own model", () => {
    const usage = {
      ...emptyUsage(),
      fastInputTokens: 1_000_000,
      fastOutputTokens: 1_000_000,
    };
    expect(runCostUsd(usage, MODELS, pricing)).toBeCloseTo(2.0, 6);
  });

  it("returns null when a tier that was used has no known price", () => {
    const usage = { ...emptyUsage(), strongInputTokens: 10 };
    expect(
      runCostUsd(
        usage,
        { fast: "gpt-4.1-mini", strong: "some-new-model" },
        pricing,
      ),
    ).toBeNull();
  });

  it("ignores a tier with no tokens even when its model is unknown", () => {
    const usage = { ...emptyUsage(), fastInputTokens: 1000, tavilyCredits: 1 };
    expect(
      runCostUsd(
        usage,
        { fast: "gpt-4.1-mini", strong: "unknown-model" },
        pricing,
      ),
    ).not.toBeNull();
  });

  it("costs nothing for a run that used nothing", () => {
    expect(runCostUsd(emptyUsage(), MODELS, pricing)).toBe(0);
  });
});

describe("estimateBatch", () => {
  it("scales the typical run by the number of runs, with a high case", () => {
    const one = estimateBatch(1, MODELS, pricing);
    const six = estimateBatch(6, MODELS, pricing);
    expect(one.perRunUsd).toBeCloseTo(0.17437, 4);
    expect(six.totalUsd).toBeCloseTo(one.perRunUsd! * 6, 6);
    expect(six.highUsd).toBeCloseTo(six.totalUsd! * pricing.highFactor, 6);
    expect(six.credits).toBe(66);
    expect(six.highCredits).toBe(66 * pricing.highFactor);
  });

  it("leaves dollar figures null and names the model when a price is unknown", () => {
    const estimate = estimateBatch(
      2,
      { fast: "gpt-4.1-mini", strong: "mystery" },
      pricing,
    );
    expect(estimate.totalUsd).toBeNull();
    expect(estimate.highUsd).toBeNull();
    expect(estimate.missingPrices).toEqual(["mystery"]);
    expect(estimate.credits).toBe(22);
  });
});
