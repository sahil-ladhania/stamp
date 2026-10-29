/**
 * File: rescore.test.ts
 * Purpose: Tests re-scoring saved runs: the round trip, repeated runs, runs saved before new fields existed, a changed golden set, and a broken folder.
 * Exports: (none)
 * Used by: vitest
 */
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  all,
  capturesBySlug,
  pricing,
  tempDir,
} from "./fixtures/run-batch-helpers.js";
import { selectGolden, type Golden } from "./golden.js";
import { rescoreDir, writeRescored } from "./rescore.js";
import { runBatch } from "./run-batch.js";
import { runRepeats } from "./run-repeats.js";

const goldens = ["gmail", "slack"].flatMap((slug) => selectGolden(all, slug));
const batch = (outDir: string) => ({
  goldens,
  parallel: 2,
  outDir,
  pricing,
  label: "two apps",
  run: (golden: Golden) => Promise.resolve(capturesBySlug(golden.slug)),
  log: () => {},
});

describe("rescoreDir", () => {
  it("gives back the scores the run was first given, when nothing has changed", async () => {
    const outDir = await tempDir();
    const original = await runBatch(batch(outDir));
    const result = await rescoreDir(outDir, { golden: all, pricing });
    expect(result.reps).toEqual([original.scores]);
    expect(result.label).toBe("two apps");
  });

  it("re-scores each repetition of a repeated run", async () => {
    const outDir = await tempDir();
    const original = await runRepeats({ ...batch(outDir), repeat: 2 });
    const result = await rescoreDir(outDir, { golden: all, pricing });
    expect(result.reps).toEqual(original.reps);
  });

  it("reads a run saved before gate evidence, search detail and resolve hits were captured", async () => {
    const outDir = await tempDir();
    await runBatch(batch(outDir));
    const file = join(outDir, "gmail.score.json");
    const saved = JSON.parse(await readFile(file, "utf8"));
    delete saved.run.resolveHits;
    delete saved.run.gates.reviewGateEvidence;
    delete saved.run.gates.approvalWaitEvidence;
    await writeFile(file, JSON.stringify(saved));
    const result = await rescoreDir(outDir, { golden: all, pricing });
    expect(result.reps[0]).toHaveLength(2);
    expect(result.reps[0]?.[0]?.gate.verdict).toBe("match");
  });

  it("applies the golden set it is given, not the one the run was first scored with", async () => {
    const outDir = await tempDir();
    await runBatch(batch(outDir));
    const stricter = all.map((golden) =>
      golden.slug === "gmail"
        ? {
            ...golden,
            avoidProducts: [
              ...golden.avoidProducts,
              {
                name: "Gmail scopes page",
                severity: "hard" as const,
                hostPathHints: ["/workspace/gmail/api/auth/scopes"],
                why: "test",
                evidence: "test",
              },
            ],
          }
        : golden,
    );
    const before = await rescoreDir(outDir, { golden: all, pricing });
    const after = await rescoreDir(outDir, { golden: stricter, pricing });
    const wrong = (r: typeof before) =>
      r.reps[0]?.[0]?.sources.wrongProduct.length ?? 0;
    expect(wrong(after)).toBeGreaterThan(wrong(before));
  });

  it("names the file that is missing", async () => {
    const outDir = await tempDir();
    await runBatch(batch(outDir));
    await writeFile(join(outDir, "slack.trace.json"), "not json");
    await expect(rescoreDir(outDir, { golden: all, pricing })).rejects.toThrow(
      /slack\.trace\.json/,
    );
  });

  it("says so when the folder is not a run", async () => {
    const outDir = await tempDir();
    await expect(rescoreDir(outDir, { golden: all, pricing })).rejects.toThrow(
      /meta\.json/,
    );
  });
});

describe("writeRescored", () => {
  it("writes the scorecard next to the run and leaves the original alone", async () => {
    const outDir = await tempDir();
    await runBatch(batch(outDir));
    const original = await readFile(join(outDir, "scorecard.md"), "utf8");
    const result = await rescoreDir(outDir, { golden: all, pricing });
    const path = await writeRescored(outDir, result);
    expect(path).toBe(join(outDir, "rescored.scorecard.md"));
    expect(await readFile(path, "utf8")).toContain("# Scorecard: two apps");
    expect(await readFile(join(outDir, "scorecard.md"), "utf8")).toBe(original);
  });
});
