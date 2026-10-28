/**
 * File: capture-fixtures.ts
 * Purpose: Hand-run capture of real Tavily search and page results into apps/api/tests/fixtures, for the node tests.
 * Exports: (none)
 * Used by: pnpm --filter api capture:fixtures (by hand only; never run by tests or CI)
 */
import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { extractPages, searchWeb } from "../src/lib/tavily.js";
import { LIMITS } from "./capture-config.js";
import { captureAll, describePlan } from "./capture-run.js";
import { checkSettings, say } from "./script-io.js";

const OUT_DIR = fileURLToPath(new URL("../tests/fixtures/", import.meta.url));

async function write(file: string, data: unknown): Promise<number> {
  const path = join(OUT_DIR, file);
  const text = `${JSON.stringify(data, null, 2)}\n`;
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, text, "utf8");
  return Buffer.byteLength(text);
}

async function main(): Promise<void> {
  if (process.argv.includes("--plan")) {
    describePlan().forEach(say);
    return;
  }
  if (!checkSettings()) {
    process.exitCode = 1;
    return;
  }
  const manifest = await captureAll({
    search: (query, { includeDomains, maxResults }) =>
      searchWeb(query, {
        timeoutMs: LIMITS.searchTimeoutMs,
        includeDomains,
        maxResults,
      }),
    extract: (urls) =>
      extractPages(urls, { timeoutMs: LIMITS.extractTimeoutMs }),
    write,
    log: say,
    now: () => new Date(),
  });
  const kb = Math.ceil(
    manifest.files.reduce((sum, file) => sum + file.bytes, 0) / 1024,
  );
  say(
    `Wrote ${manifest.files.length} files (${kb} KB) to apps/api/tests/fixtures/, ${manifest.failures.length} failed.`,
  );
  process.exitCode = manifest.failures.length === 0 ? 0 : 1;
}

await main();
