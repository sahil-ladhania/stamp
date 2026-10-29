/**
 * File: rescore.ts
 * Purpose: Entry for `pnpm --filter api eval:rescore -- <run folder>`: scores a saved run again with the current golden set and scorer. Makes no model or search call and costs nothing.
 * Exports: (none)
 * Used by: pnpm --filter api eval:rescore (by hand)
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, say } from "../scripts/script-io.js";
import { loadPricing } from "./lib/cost.js";
import { loadGolden } from "./lib/golden.js";
import { rescoreDir, writeRescored } from "./lib/rescore.js";

const USAGE = "Usage: pnpm --filter api eval:rescore -- <run folder>";

async function main(): Promise<void> {
  const dir = process.argv.slice(2).find((arg) => arg !== "--");
  if (dir === undefined) throw new Error(USAGE);
  const runDir = resolve(dir);
  const rescored = await rescoreDir(runDir, {
    golden: await loadGolden(),
    pricing: await loadPricing(),
  });
  const path = await writeRescored(runDir, rescored);
  say(await readFile(path, "utf8"));
  say(`Written: ${path}`);
}

try {
  await main();
} catch (err) {
  say(`Rescore stopped: ${describe(err)}`);
  process.exitCode = 1;
}
