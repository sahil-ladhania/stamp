/**
 * File: plan-batch.test.ts
 * Purpose: Tests planning a batch: the apps picked, the 12-run limit, the holdout guard and the printed estimate.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { loadPricing } from "./cost.js";
import { loadGolden, type Golden } from "./golden.js";
import { planBatch } from "./plan-batch.js";

const all = await loadGolden();
const pricing = await loadPricing();
const MODELS = { fast: "gpt-4.1-mini", strong: "gpt-4.1" };
const args = (selector: string, over = {}) => ({
  selector,
  parallel: 2,
  confirm: false,
  allowHoldout: false,
  out: null,
  ...over,
});

describe("planBatch", () => {
  it("picks the six tuning apps and prints the estimate with its basis", () => {
    const plan = planBatch(args("tuning"), all, pricing, MODELS);
    expect(plan.goldens.map((g) => g.slug)).toEqual([
      "github",
      "gmail",
      "hubspot",
      "microsoft",
      "notion",
      "slack",
    ]);
    const text = plan.lines.join("\n");
    expect(text).toContain("Runs: 6 (at most 12 per batch), 2 at a time");
    expect(text).toContain("Models: fast gpt-4.1-mini, strong gpt-4.1");
    expect(text).toMatch(/about \$1\.05 .*up to \$2\.09/);
    expect(text).toContain("66 Tavily credits (up to 132)");
    expect(text).toContain(pricing.typicalRun.basis);
    expect(text).toContain("no guide is saved to the database");
  });

  it("names the price sources so the figures can be checked", () => {
    const text = planBatch(args("gmail"), all, pricing, MODELS).lines.join(
      "\n",
    );
    expect(text).toContain(
      "https://developers.openai.com/api/docs/models/gpt-4.1",
    );
    expect(text).toContain("https://docs.tavily.com/documentation/api-credits");
  });

  it("says the dollars are unknown when a model has no listed price", () => {
    const text = planBatch(args("gmail"), all, pricing, {
      fast: "gpt-4.1-mini",
      strong: "mystery",
    }).lines.join("\n");
    expect(text).toContain(
      "dollars unknown: no price for mystery in evals/pricing.json",
    );
    expect(text).toContain("11 Tavily credits");
  });

  it("refuses a batch of more than 12 runs", () => {
    const many: Golden[] = Array.from({ length: 13 }, (_, i) => ({
      ...all[0]!,
      slug: `app${i}`,
      set: "tuning" as const,
    }));
    expect(() => planBatch(args("tuning"), many, pricing, MODELS)).toThrow(
      /at most 12 runs/,
    );
  });

  it("refuses the holdout set without --allow-holdout", () => {
    expect(() => planBatch(args("holdout"), all, pricing, MODELS)).toThrow(
      /--allow-holdout/,
    );
    expect(() => planBatch(args("zoom"), all, pricing, MODELS)).toThrow(
      /--allow-holdout/,
    );
  });

  it("plans the holdout set once the flag is given, and says it is the holdout", () => {
    const plan = planBatch(
      args("holdout", { allowHoldout: true }),
      all,
      pricing,
      MODELS,
    );
    expect(plan.goldens).toHaveLength(4);
    expect(plan.lines.join("\n")).toContain("HOLDOUT");
  });

  it("explains an unknown selector", () => {
    expect(() => planBatch(args("nope"), all, pricing, MODELS)).toThrow(
      /Unknown golden "nope"/,
    );
  });
});
