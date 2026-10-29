/**
 * File: credits-used.test.ts
 * Purpose: Tests adding up the Tavily credits and dollars recorded in every saved eval run folder, and how the plan prints them.
 * Exports: (none)
 * Used by: vitest
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { all, pricing, tempDir } from "./fixtures/run-batch-helpers.js";
import { creditsUsed } from "./credits-used.js";
import { loadPricing } from "./cost.js";
import { selectGolden } from "./golden.js";
import { planBatch } from "./plan-batch.js";
import { runBatch } from "./run-batch.js";
import { runRepeats } from "./run-repeats.js";
import { capturesBySlug } from "./fixtures/run-batch-helpers.js";

const goldens = ["gmail", "slack"].flatMap((slug) => selectGolden(all, slug));
const batch = (outDir: string) => ({
  goldens,
  parallel: 2,
  outDir,
  pricing,
  label: "x",
  run: (golden: (typeof goldens)[number]) =>
    Promise.resolve(capturesBySlug(golden.slug)),
  log: () => {},
});

describe("creditsUsed", () => {
  it("is zero for a folder that does not exist or holds no runs", async () => {
    const empty = await tempDir();
    expect(await creditsUsed(join(empty, "nope"))).toEqual({
      credits: 0,
      runs: 0,
      usd: 0,
    });
    expect(await creditsUsed(empty)).toEqual({ credits: 0, runs: 0, usd: 0 });
  });

  it("adds up the credits and cost of every run in every folder, repetitions included", async () => {
    const runs = await tempDir();
    await runBatch(batch(join(runs, "2026-01-01T00-00-00Z")));
    await runRepeats({
      ...batch(join(runs, "2026-01-02T00-00-00Z")),
      repeat: 2,
    });
    const used = await creditsUsed(runs);
    expect(used.runs).toBe(2 + 4);
    // the fixtures record 11 credits a run
    expect(used.credits).toBe(6 * 11);
    expect(used.usd).toBeGreaterThan(0);
  });

  it("ignores files that are not run scores", async () => {
    const runs = await tempDir();
    await mkdir(join(runs, "a"), { recursive: true });
    await writeFile(join(runs, "a", "scorecard.md"), "x");
    await writeFile(join(runs, "a", "meta.json"), "{}");
    expect((await creditsUsed(runs)).runs).toBe(0);
  });
});

describe("planBatch credit lines", () => {
  const MODELS = { fast: "gpt-4.1-mini", strong: "gpt-4.1" };
  const args = {
    selector: "tuning",
    parallel: 2,
    repeat: 1,
    confirm: false,
    allowHoldout: false,
    out: null,
  };

  it("prints the credits used so far, this batch and the running total", async () => {
    const real = await loadPricing();
    const text = planBatch(args, all, real, MODELS, {
      credits: 60,
      runs: 6,
      usd: 1.04,
    }).lines.join("\n");
    expect(text).toContain(
      "Credits used by evals so far: 60 in 6 runs (about $1.04).",
    );
    expect(text).toContain(
      "This batch: 60 (up to 120). Running total after it: 120 (up to 180).",
    );
  });

  it("says nothing has been used when there are no saved runs", async () => {
    const real = await loadPricing();
    const text = planBatch(args, all, real, MODELS).lines.join("\n");
    expect(text).toContain("Credits used by evals so far: 0 in 0 runs");
  });
});
