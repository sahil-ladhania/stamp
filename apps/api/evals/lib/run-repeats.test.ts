/**
 * File: run-repeats.test.ts
 * Purpose: Tests running a selection once or several times: the folders written, the combined scorecard and that the repetitions run one after another.
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
import { selectGolden } from "./golden.js";
import { runRepeats } from "./run-repeats.js";

const goldens = ["gmail", "slack"].flatMap((slug) => selectGolden(all, slug));
const base = (outDir: string, repeat: number, order: string[] = []) => ({
  goldens,
  parallel: 2,
  repeat,
  outDir,
  pricing,
  label: "two apps",
  run: (golden: (typeof goldens)[number]) => {
    order.push(golden.slug);
    return Promise.resolve(capturesBySlug(golden.slug));
  },
  now: () => new Date("2026-10-29T10:00:00.000Z"),
  log: () => {},
});

describe("runRepeats", () => {
  it("runs once into the folder itself, as a plain batch", async () => {
    const outDir = await tempDir();
    const result = await runRepeats(base(outDir, 1));
    expect(result.reps).toHaveLength(1);
    expect((await readdir(outDir)).sort()).toContain("gmail.guide.json");
    expect(result.scorecardPath).toBe(join(outDir, "scorecard.md"));
  });

  it("runs each repetition into its own folder and writes a combined scorecard", async () => {
    const outDir = await tempDir();
    const result = await runRepeats(base(outDir, 3));
    expect(result.reps).toHaveLength(3);
    const entries = (await readdir(outDir)).sort();
    expect(entries).toEqual([
      "meta.json",
      "rep-1",
      "rep-2",
      "rep-3",
      "scorecard.md",
    ]);
    expect(await readdir(join(outDir, "rep-2"))).toContain("gmail.score.json");
    const card = await readFile(join(outDir, "scorecard.md"), "utf8");
    expect(card).toContain("# Scorecard: two apps, 3 repetitions");
  });

  it("finishes one repetition before the next starts", async () => {
    const outDir = await tempDir();
    const order: string[] = [];
    await runRepeats(base(outDir, 2, order));
    // two apps per repetition: the first two calls are repetition 1, the next two repetition 2
    expect(order).toHaveLength(4);
    expect(new Set(order.slice(0, 2))).toEqual(new Set(["gmail", "slack"]));
    expect(new Set(order.slice(2))).toEqual(new Set(["gmail", "slack"]));
  });

  it("records the repetitions in meta.json", async () => {
    const outDir = await tempDir();
    await runRepeats(base(outDir, 2));
    const meta = JSON.parse(await readFile(join(outDir, "meta.json"), "utf8"));
    expect(meta).toMatchObject({
      label: "two apps",
      repeat: 2,
      apps: ["gmail", "slack"],
    });
  });
});
