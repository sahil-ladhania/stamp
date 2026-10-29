/**
 * File: rescore.ts
 * Purpose: Scores a saved run folder again with the current golden set and scorer, so before and after tables always compare like with like. Reads runs saved before newer fields existed.
 * Exports: rescoreDir, writeRescored, Rescored, RescoreOptions
 * Used by: evals/rescore.ts
 */
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { scoreApp } from "../scoring/score-app.js";
import { runCostUsd, type Pricing } from "./cost.js";
import type { Golden } from "./golden.js";
import { renderScorecard } from "./scorecard.js";
import { renderRepeatScorecard } from "./scorecard-repeat.js";
import type { AppScore, RunCapture } from "./types.js";

export type RescoreOptions = { golden: readonly Golden[]; pricing: Pricing };
export type Rescored = { label: string; reps: AppScore[][] };

type Meta = { label: string; apps: string[]; repeat?: number };

async function readJson(dir: string, file: string): Promise<unknown> {
  try {
    return JSON.parse(await readFile(join(dir, file), "utf8"));
  } catch (err) {
    const why = err instanceof Error ? err.message : "unknown error";
    throw new Error(`Cannot read ${file} in ${dir}: ${why}`, { cause: err });
  }
}

async function readMeta(dir: string): Promise<Meta> {
  const meta = (await readJson(dir, "meta.json")) as Partial<Meta>;
  if (typeof meta.label !== "string" || !Array.isArray(meta.apps)) {
    throw new Error(`meta.json in ${dir} is not a run's meta.json`);
  }
  return { label: meta.label, apps: meta.apps, repeat: meta.repeat };
}

/** Puts back the fields a run saved before they were captured does not have, as empty. */
function toCapture(
  saved: { run: Record<string, unknown> },
  guide: unknown,
  trace: { events?: unknown; logs?: unknown },
): RunCapture {
  const run = saved.run as Partial<RunCapture> & Record<string, unknown>;
  const gates = run.gates
    ? {
        ...run.gates,
        reviewGateEvidence: run.gates.reviewGateEvidence ?? null,
        approvalWaitEvidence: run.gates.approvalWaitEvidence ?? null,
      }
    : null;
  return {
    ...(run as RunCapture),
    resolveHits: run.resolveHits ?? [],
    searchResults: run.searchResults ?? [],
    gates,
    guide: (guide ?? null) as RunCapture["guide"],
    events: (trace.events ?? []) as RunCapture["events"],
    logs: (trace.logs ?? []) as RunCapture["logs"],
  };
}

async function rescoreFlat(
  dir: string,
  apps: readonly string[],
  options: RescoreOptions,
): Promise<AppScore[]> {
  return Promise.all(
    apps.map(async (slug) => {
      const golden = options.golden.find((entry) => entry.slug === slug);
      if (!golden) throw new Error(`No golden file for ${slug}`);
      const saved = (await readJson(dir, `${slug}.score.json`)) as {
        run: Record<string, unknown>;
      };
      const guide = await readJson(dir, `${slug}.guide.json`);
      const trace = (await readJson(dir, `${slug}.trace.json`)) as {
        events?: unknown;
        logs?: unknown;
      };
      const capture = toCapture(saved, guide, trace);
      return scoreApp(
        capture,
        golden,
        runCostUsd(capture.usage, capture.models, options.pricing),
      );
    }),
  );
}

/** A folder from one repetition, or from several (rep-1, rep-2, ...), scored again in app order. */
export async function rescoreDir(
  dir: string,
  options: RescoreOptions,
): Promise<Rescored> {
  const meta = await readMeta(dir);
  const repeats = meta.repeat ?? 1;
  const dirs =
    repeats > 1
      ? Array.from({ length: repeats }, (_, i) => join(dir, `rep-${i + 1}`))
      : [dir];
  const reps = await Promise.all(
    dirs.map((repDir) => rescoreFlat(repDir, meta.apps, options)),
  );
  return { label: meta.label, reps };
}

/** Writes rescored.scorecard.md beside the original, which is left as it was. */
export async function writeRescored(
  dir: string,
  rescored: Rescored,
): Promise<string> {
  const meta = {
    label: `${rescored.label} (rescored)`,
    generatedAt: new Date().toISOString(),
    runDir: dir,
  };
  const card =
    rescored.reps.length === 1
      ? renderScorecard(rescored.reps[0] ?? [], meta)
      : renderRepeatScorecard(rescored.reps, meta);
  const path = join(dir, "rescored.scorecard.md");
  await writeFile(path, card);
  return path;
}
