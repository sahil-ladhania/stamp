/**
 * File: library-args.ts
 * Purpose: Reads the command lines of the two library scripts. Throws a message that includes the usage line for anything it cannot read.
 * Exports: parseExportArgs, parseSeedArgs, ExportArgs, SeedArgs, EXPORT_USAGE, SEED_USAGE
 * Used by: scripts/library-export.ts, scripts/db-seed.ts
 */

export const EXPORT_USAGE =
  "Usage: pnpm --filter api library:export -- --run <eval run folder> --apps github,hubspot [--out <folder>]";
export const SEED_USAGE = "Usage: pnpm --filter api db:seed [-- --dry-run]";

export type ExportArgs = {
  runDir: string;
  slugs: string[];
  outDir: string | null;
};
export type SeedArgs = { dryRun: boolean };

type Options = { values: Map<string, string>; flags: Set<string> };

/** Splits `--name value`, `--name=value` and bare flags; the `--` pnpm passes through is dropped. */
function readOptions(
  argv: readonly string[],
  valueNames: ReadonlySet<string>,
  flagNames: ReadonlySet<string>,
  usage: string,
): Options {
  const values = new Map<string, string>();
  const flags = new Set<string>();
  const tokens = argv.filter((token) => token !== "--");
  for (let i = 0; i < tokens.length; i += 1) {
    const [name = "", inline] = (tokens[i] ?? "").split(/=(.*)/s);
    if (flagNames.has(name)) {
      flags.add(name);
    } else if (valueNames.has(name)) {
      const value = inline ?? tokens[(i += 1)];
      if (value === undefined)
        throw new Error(`${name} needs a value. ${usage}`);
      values.set(name, value);
    } else {
      throw new Error(`Unknown option ${name}. ${usage}`);
    }
  }
  return { values, flags };
}

export function parseExportArgs(argv: readonly string[]): ExportArgs {
  const { values } = readOptions(
    argv,
    new Set(["--run", "--apps", "--out"]),
    new Set(),
    EXPORT_USAGE,
  );
  const runDir = values.get("--run");
  if (runDir === undefined) throw new Error(`Missing --run. ${EXPORT_USAGE}`);
  const slugs = (values.get("--apps") ?? "")
    .split(",")
    .map((slug) => slug.trim())
    .filter(Boolean);
  if (slugs.length === 0)
    throw new Error(`Missing --apps: name each app to export. ${EXPORT_USAGE}`);
  return {
    runDir,
    slugs: [...new Set(slugs)],
    outDir: values.get("--out") ?? null,
  };
}

export function parseSeedArgs(argv: readonly string[]): SeedArgs {
  const { flags } = readOptions(
    argv,
    new Set(),
    new Set(["--dry-run"]),
    SEED_USAGE,
  );
  return { dryRun: flags.has("--dry-run") };
}
