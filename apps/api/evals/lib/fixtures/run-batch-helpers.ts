/**
 * File: run-batch-helpers.ts
 * Purpose: Shared setup for the runBatch tests: the golden set and pricing, temporary output folders that are removed after each test, and a capture for any slug.
 * Exports: all, pricing, tempDir, capturesBySlug
 * Used by: evals/lib/run-batch.test.ts, evals/lib/run-batch-files.test.ts
 */
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach } from "vitest";
import { loadPricing } from "../cost.js";
import { loadGolden } from "../golden.js";
import type { RunCapture } from "../types.js";
import { goodCapture } from "./run-capture.js";
import { brokenCapture } from "./broken-capture.js";

export const all = await loadGolden();
export const pricing = await loadPricing();
const dirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

export async function tempDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "stamp-eval-"));
  dirs.push(dir);
  return dir;
}

export const capturesBySlug = (slug: string): RunCapture => ({
  ...(slug === "slack" ? brokenCapture() : goodCapture()),
  slug,
});
