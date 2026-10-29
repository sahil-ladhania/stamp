/**
 * File: run-batch.test.ts
 * Purpose: Tests running a batch with a fake run function: scoring, the scorecard, the cost of each run and the parallel limit.
 * Exports: (none)
 * Used by: vitest
 */
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  all,
  capturesBySlug,
  pricing,
  tempDir,
} from "./fixtures/run-batch-helpers.js";
import { goodCapture } from "./fixtures/run-capture.js";
import { selectGolden } from "./golden.js";
import { runBatch } from "./run-batch.js";

describe("runBatch", () => {
  it("scores each app, writes its files and the scorecard", async () => {
    const outDir = await tempDir();
    const goldens = ["gmail", "slack"].flatMap((slug) =>
      selectGolden(all, slug),
    );
    const result = await runBatch({
      goldens,
      parallel: 2,
      outDir,
      pricing,
      label: "two apps",
      run: (golden) => Promise.resolve(capturesBySlug(golden.slug)),
      now: () => new Date("2026-10-29T10:00:00.000Z"),
      log: () => {},
    });

    expect(result.scores.map((s) => s.slug)).toEqual(["gmail", "slack"]);
    const files = (await readdir(outDir)).sort();
    expect(files).toEqual([
      "gmail.guide.json",
      "gmail.score.json",
      "gmail.trace.json",
      "meta.json",
      "scorecard.md",
      "slack.guide.json",
      "slack.score.json",
      "slack.trace.json",
    ]);
    const scorecard = await readFile(join(outDir, "scorecard.md"), "utf8");
    expect(scorecard).toContain("# Scorecard: two apps");
    expect(scorecard).toContain("| gmail |");
    expect(scorecard).toContain("| slack |");
  });

  it("prices each run from its own usage and models", async () => {
    const outDir = await tempDir();
    const goldens = selectGolden(all, "gmail");
    const result = await runBatch({
      goldens,
      parallel: 1,
      outDir,
      pricing,
      label: "one",
      run: () => Promise.resolve(goodCapture()),
      log: () => {},
    });
    // 36000 x $2 + 1800 x $8 per million, plus 11 credits at $0.008
    expect(result.scores[0]?.costUsd).toBeCloseTo(
      (36_000 * 2 + 1_800 * 8) / 1e6 + 11 * 0.008,
      6,
    );
  });

  it("leaves the cost unknown when the run used a model with no listed price", async () => {
    const outDir = await tempDir();
    const result = await runBatch({
      goldens: selectGolden(all, "gmail"),
      parallel: 1,
      outDir,
      pricing,
      label: "one",
      run: () =>
        Promise.resolve({
          ...goodCapture(),
          models: { fast: "gpt-4.1-mini", strong: "mystery" },
        }),
      log: () => {},
    });
    expect(result.scores[0]?.costUsd).toBeNull();
  });

  it("never runs more apps at once than the parallel limit", async () => {
    const outDir = await tempDir();
    let active = 0;
    let peak = 0;
    await runBatch({
      goldens: all.filter((g) => g.set === "tuning"),
      parallel: 2,
      outDir,
      pricing,
      label: "tuning",
      run: async (golden) => {
        active += 1;
        peak = Math.max(peak, active);
        await new Promise((resolve) => setTimeout(resolve, 5));
        active -= 1;
        return capturesBySlug(golden.slug);
      },
      log: () => {},
    });
    expect(peak).toBe(2);
  });
});
