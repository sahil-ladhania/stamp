/**
 * File: cli.ts
 * Purpose: Entry for `pnpm --filter api eval -- --set tuning|holdout|<slug>`: prints the cost estimate and stops, unless --confirm is given, then runs the batch in-process and writes the scorecard.
 * Exports: (none)
 * Used by: pnpm --filter api eval (by hand only; never run by tests or CI)
 */
import "dotenv/config";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { checkSettings, describe, say } from "../scripts/script-io.js";
import { parseArgs } from "./lib/cli-args.js";
import { loadPricing } from "./lib/cost.js";
import { loadGolden } from "./lib/golden.js";
import { tapLogs } from "./lib/log-tap.js";
import { planBatch } from "./lib/plan-batch.js";
import { runBatch } from "./lib/run-batch.js";
import { runOne } from "./lib/run-one.js";

const RUNS_DIR = fileURLToPath(new URL("./runs/", import.meta.url));

/** A folder name from the clock: 2026-10-29T10-00-00Z. */
function runFolder(now: Date): string {
  return `${now.toISOString().slice(0, 19).replace(/:/g, "-")}Z`;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const pricing = await loadPricing();
  const models = {
    fast: process.env.OPENAI_MODEL_FAST ?? "unset",
    strong: process.env.OPENAI_MODEL_STRONG ?? "unset",
  };
  const plan = planBatch(args, await loadGolden(), pricing, models);
  plan.lines.forEach(say);

  if (!args.confirm) {
    say("");
    say(
      "Dry run: nothing was run and nothing was spent. Add --confirm to run this batch.",
    );
    return;
  }

  // Set before anything reads the config, so the real clients are used whatever the .env says.
  process.env.AGENT_MODE = "real";
  if (!checkSettings()) {
    process.exitCode = 1;
    return;
  }
  const outDir = args.out ?? join(RUNS_DIR, runFolder(new Date()));
  const tap = tapLogs();
  try {
    const result = await runBatch({
      goldens: plan.goldens,
      parallel: args.parallel,
      outDir,
      pricing,
      label: args.selector,
      run: (golden) => runOne(golden, { tap }),
      log: say,
    });
    say("");
    say(await readFile(result.scorecardPath, "utf8"));
    say(`Files: ${outDir}`);
  } finally {
    tap.stop();
  }
}

try {
  await main();
} catch (err) {
  say(`Eval stopped: ${describe(err)}`);
  process.exitCode = 1;
}
