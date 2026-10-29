/**
 * File: db-seed.ts
 * Purpose: Seeds the library guides in apps/api/library into the database named by DATABASE_URL. Each file is checked first; if any fails, nothing is written. --dry-run does the checks, names the target and opens no connection.
 * Exports: (none)
 * Used by: pnpm --filter api db:seed (by hand only; never run by tests or CI)
 */
import type { Guide } from "@stamp/schema";
import { databaseLabel } from "../src/library/database-label.js";
import {
  describeFailures,
  describeNotes,
} from "../src/library/describe-check.js";
import { readLibraryDir } from "../src/library/read-library.js";
import { parseSeedArgs } from "./library-args.js";
import { describe, say } from "./script-io.js";

/** Where this run would write, by host and database name only. Reads DATABASE_URL; opens no connection. */
async function targetLine(): Promise<string> {
  await import("dotenv/config");
  const url = process.env.DATABASE_URL;
  return url
    ? `Target: ${databaseLabel(url)}`
    : "Target: DATABASE_URL is not set";
}

async function seed(guides: readonly Guide[]): Promise<void> {
  const { prisma } = await import("../src/lib/prisma.js");
  const { seedLibraryGuides } = await import("../src/services/library-seed.js");
  say(`Seeding ${guides.length} guides. ${await targetLine()}`);
  try {
    for (const { slug, action } of await seedLibraryGuides(guides)) {
      say(`${slug}: ${action}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

async function main(): Promise<void> {
  const { dryRun } = parseSeedArgs(process.argv.slice(2));
  const files = await readLibraryDir();
  if (files.length === 0) {
    say("No guides in apps/api/library. Run library:export first.");
    process.exitCode = 1;
    return;
  }
  for (const { slug, check } of files) {
    say(
      `${slug}: ${check.failures.length === 0 ? "ok" : "fails the library check"}`,
    );
    describeFailures(check.failures).forEach(say);
    describeNotes(check.notes).forEach(say);
  }
  const guides = files.flatMap(({ check }) =>
    check.failures.length === 0 && check.guide ? [check.guide] : [],
  );
  if (guides.length < files.length) {
    say("Nothing seeded: fix or remove the guides above.");
    process.exitCode = 1;
    return;
  }
  if (dryRun) {
    say(
      `Dry run: ${guides.length} guides would be written. ${await targetLine()}`,
    );
    say("No connection was opened.");
    return;
  }
  await seed(guides);
}

main().catch((err: unknown) => {
  say(describe(err));
  process.exitCode = 1;
});
