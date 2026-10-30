/**
 * File: cli.ts
 * Purpose: Entry for `pnpm --filter api eval:resolve`: runs ONLY the resolve stage (one search per typed name, no plan, fetch or model call) over the stress list, prints the cost first and stops unless --confirm is given. --replay decides again from a saved run's hits at no cost.
 * Exports: (none)
 * Used by: pnpm --filter api eval:resolve (by hand only; never run by tests or CI)
 */
import "dotenv/config";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { NODE_CAP_MS } from "../../src/agent/budget.js";
import { RESOLVE_MAX_RESULTS } from "../../src/agent/nodes/resolve.js";
import { searchWeb } from "../../src/lib/tavily.js";
import { mapLimit } from "../../src/utils/map-limit.js";
import { checkSettings, describe, say } from "../../scripts/script-io.js";
import { runFolder } from "../lib/run-folder.js";
import { MAX_SEARCHES, parseResolveArgs } from "./cli-args.js";
import { loadProviders, needsSearch, type Provider } from "./providers.js";
import { renderReport } from "./report.js";
import {
  replayOne,
  resolveOne,
  type ResolveRecord,
  type SearchFn,
} from "./resolve-one.js";

const RUNS_DIR = fileURLToPath(new URL("../runs/", import.meta.url));
const PARALLEL = 4;

const search: SearchFn = (query) =>
  searchWeb(query, {
    timeoutMs: NODE_CAP_MS.resolve,
    maxResults: RESOLVE_MAX_RESULTS,
  });

async function save(
  outDir: string,
  records: ResolveRecord[],
  heading: string,
): Promise<void> {
  await mkdir(outDir, { recursive: true });
  await writeFile(
    join(outDir, "results.json"),
    `${JSON.stringify(records, null, 2)}\n`,
    "utf8",
  );
  await writeFile(
    join(outDir, "report.md"),
    `${renderReport(records, heading)}\n`,
    "utf8",
  );
  say(`Files: ${outDir}`);
}

async function replay(
  folder: string,
  providers: Provider[],
  outDir: string,
): Promise<void> {
  const saved = JSON.parse(
    await readFile(join(resolve(folder), "results.json"), "utf8"),
  ) as ResolveRecord[];
  const byTyped = new Map(
    providers.map((provider) => [provider.typed, provider]),
  );
  const records = saved.map((record) =>
    replayOne(byTyped.get(record.typed), record),
  );
  say(renderReport(records, `Resolve stress, decided again from ${folder}`));
  await save(outDir, records, `Resolve stress, decided again from ${folder}`);
}

async function main(): Promise<void> {
  const args = parseResolveArgs(process.argv.slice(2));
  const all = await loadProviders();
  const providers =
    args.only === null ? all : all.filter((p) => args.only?.includes(p.typed));
  const outDir = args.out ?? join(RUNS_DIR, `${runFolder(new Date())}-resolve`);

  if (args.replay !== null) {
    say("Decide again from saved hits: no search, no credits.");
    await replay(args.replay, all, outDir);
    return;
  }

  const searches = providers.filter(needsSearch).length;
  say(
    `Resolve only: ${providers.length} providers, ${searches} searches (basic search, 1 Tavily credit each).`,
  );
  say("No plan, search, fetch, extract or model call: no OpenAI cost.");
  say(
    `Estimate: ${searches} Tavily credits (at most ${MAX_SEARCHES} allowed in one run).`,
  );
  if (searches > MAX_SEARCHES) {
    say(
      `Refused: ${searches} searches is more than ${MAX_SEARCHES}. Use --only.`,
    );
    process.exitCode = 1;
    return;
  }
  if (!args.confirm) {
    say(
      "Dry run: nothing was run and nothing was spent. Add --confirm to run.",
    );
    return;
  }
  if (!checkSettings()) {
    process.exitCode = 1;
    return;
  }
  const records = await mapLimit(providers, PARALLEL, (provider) =>
    resolveOne(provider, search),
  );
  const credits = records.reduce(
    (sum, record) => sum + (record.credits ?? 0),
    0,
  );
  say(renderReport(records, "Resolve stress run"));
  say(`Tavily credits reported by the searches: ${credits}.`);
  await save(outDir, records, "Resolve stress run");
}

main().catch((err: unknown) => {
  say(describe(err));
  process.exitCode = 1;
});
