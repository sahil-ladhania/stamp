/**
 * File: library-export.ts
 * Purpose: Copies saved guides from an eval run folder into apps/api/library, only those that pass the library check. Never edits a guide, calls no network, model or database.
 * Exports: (none)
 * Used by: pnpm --filter api library:export (by hand only; never run by tests or CI)
 */
import { resolve } from "node:path";
import {
  describeFailures,
  describeNotes,
} from "../src/library/describe-check.js";
import { exportGuides } from "../src/library/export-guides.js";
import { LIBRARY_DIR } from "../src/library/read-library.js";
import { parseExportArgs } from "./library-args.js";
import { describe, say } from "./script-io.js";

async function main(): Promise<void> {
  const args = parseExportArgs(process.argv.slice(2));
  const outDir = args.outDir ? resolve(args.outDir) : LIBRARY_DIR;
  const outcomes = await exportGuides({
    runDir: resolve(args.runDir),
    slugs: args.slugs,
    outDir,
  });
  for (const outcome of outcomes) {
    say(`${outcome.slug}: ${outcome.status}`);
    describeFailures(outcome.failures).forEach(say);
    describeNotes(outcome.notes).forEach(say);
  }
  const written = outcomes.filter(
    (outcome) => outcome.status === "written",
  ).length;
  say(`${written} of ${outcomes.length} written to ${outDir}`);
  if (written < outcomes.length) process.exitCode = 1;
}

main().catch((err: unknown) => {
  say(describe(err));
  process.exitCode = 1;
});
