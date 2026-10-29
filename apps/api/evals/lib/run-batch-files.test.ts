/**
 * File: run-batch-files.test.ts
 * Purpose: Tests the files runBatch writes: meta.json without settings, the trace and score kept apart from the guide, and null for a run with no guide.
 * Exports: (none)
 * Used by: vitest
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { all, pricing, tempDir } from "./fixtures/run-batch-helpers.js";
import { goodCapture } from "./fixtures/run-capture.js";
import { selectGolden } from "./golden.js";
import { runBatch } from "./run-batch.js";

describe("runBatch output files", () => {
  it("records the run in meta.json without any settings", async () => {
    const outDir = await tempDir();
    await runBatch({
      goldens: selectGolden(all, "gmail"),
      parallel: 1,
      outDir,
      pricing,
      label: "one",
      run: () => Promise.resolve(goodCapture()),
      log: () => {},
      now: () => new Date("2026-10-29T10:00:00.000Z"),
    });
    const meta = JSON.parse(
      await readFile(join(outDir, "meta.json"), "utf8"),
    ) as Record<string, unknown>;
    expect(meta).toMatchObject({
      label: "one",
      apps: ["gmail"],
      parallel: 1,
      pricingAsOf: pricing.asOf,
    });
    expect(Object.keys(meta).sort()).toEqual([
      "apps",
      "finishedAt",
      "label",
      "parallel",
      "pricingAsOf",
      "startedAt",
    ]);
  });

  it("keeps the trace and the score apart from the guide", async () => {
    const outDir = await tempDir();
    const capture = {
      ...goodCapture(),
      logs: [{ message: "run summary", runId: "r" }],
      events: [{ tMs: 5, event: { type: "stage.started" } }],
    };
    await runBatch({
      goldens: selectGolden(all, "gmail"),
      parallel: 1,
      outDir,
      pricing,
      label: "one",
      run: () => Promise.resolve(capture),
      log: () => {},
    });
    const trace = JSON.parse(
      await readFile(join(outDir, "gmail.trace.json"), "utf8"),
    ) as Record<string, unknown>;
    const score = JSON.parse(
      await readFile(join(outDir, "gmail.score.json"), "utf8"),
    ) as Record<string, unknown>;
    const guide = JSON.parse(
      await readFile(join(outDir, "gmail.guide.json"), "utf8"),
    ) as Record<string, unknown>;
    expect(trace).toEqual({ events: capture.events, logs: capture.logs });
    expect(Object.keys(score).sort()).toEqual(["run", "score"]);
    expect(guide.slug).toBe("gmail");
    expect(score.run).not.toHaveProperty("guide");
    expect(score.run).not.toHaveProperty("events");
  });

  it("writes null for a run that produced no guide", async () => {
    const outDir = await tempDir();
    await runBatch({
      goldens: selectGolden(all, "gmail"),
      parallel: 1,
      outDir,
      pricing,
      label: "one",
      run: () =>
        Promise.resolve({
          ...goodCapture(),
          guide: null,
          outcome: { ok: false, code: "INTERNAL" },
        }),
      log: () => {},
    });
    expect(await readFile(join(outDir, "gmail.guide.json"), "utf8")).toBe(
      "null\n",
    );
  });
});
