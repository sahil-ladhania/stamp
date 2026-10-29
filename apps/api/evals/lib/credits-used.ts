/**
 * File: credits-used.ts
 * Purpose: Adds up the Tavily credits and dollars recorded in every saved eval run, so each batch can show what the evals have used so far and the running total.
 * Exports: creditsUsed, CreditsUsed
 * Used by: evals/cli.ts, evals/lib/plan-batch.ts
 */
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

export type CreditsUsed = { credits: number; runs: number; usd: number };

type SavedScore = {
  run?: { usage?: { tavilyCredits?: number } };
  score?: { costUsd?: number | null };
};

async function scoreFiles(dir: string): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return scoreFiles(path);
      return entry.name.endsWith(".score.json") ? [path] : [];
    }),
  );
  return nested.flat();
}

/**
 * Every `<slug>.score.json` under the folder is one run, however deep (repetitions sit in rep-N folders).
 * It counts what is saved: a run folder that was deleted is not counted.
 */
export async function creditsUsed(runsDir: string): Promise<CreditsUsed> {
  const total: CreditsUsed = { credits: 0, runs: 0, usd: 0 };
  for (const file of await scoreFiles(runsDir)) {
    const saved = JSON.parse(await readFile(file, "utf8")) as SavedScore;
    total.credits += saved.run?.usage?.tavilyCredits ?? 0;
    total.usd += saved.score?.costUsd ?? 0;
    total.runs += 1;
  }
  return total;
}
