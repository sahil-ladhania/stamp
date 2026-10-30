/**
 * File: cli-args.ts
 * Purpose: Reads the resolve stress command line and holds its search cap.
 * Exports: parseResolveArgs, ResolveArgs, MAX_SEARCHES, USAGE
 * Used by: evals/resolve/cli.ts
 */

/** The most searches (Tavily credits) one run may make; the list needs 32. */
export const MAX_SEARCHES = 40;

export const USAGE =
  "Usage: pnpm --filter api eval:resolve -- [--confirm] [--only Spotify,Box] [--replay <run folder>] [--out <folder>]";

export type ResolveArgs = {
  /** Without this the command only prints the estimate. */
  confirm: boolean;
  only: string[] | null;
  /** A saved run folder: decide again from its saved hits, no search. */
  replay: string | null;
  out: string | null;
};

const VALUE_OPTIONS = new Set(["--only", "--replay", "--out"]);
const FLAG_OPTIONS = new Set(["--confirm"]);

/** Throws a message that includes the usage line for anything it cannot read. */
export function parseResolveArgs(argv: readonly string[]): ResolveArgs {
  const values = new Map<string, string>();
  const flags = new Set<string>();
  const tokens = argv.filter((token) => token !== "--");
  for (let i = 0; i < tokens.length; i += 1) {
    const [name = "", inline] = (tokens[i] ?? "").split(/=(.*)/s);
    if (FLAG_OPTIONS.has(name)) {
      flags.add(name);
    } else if (VALUE_OPTIONS.has(name)) {
      const value = inline ?? tokens[(i += 1)];
      if (value === undefined)
        throw new Error(`${name} needs a value. ${USAGE}`);
      values.set(name, value);
    } else {
      throw new Error(`Unknown option ${name}. ${USAGE}`);
    }
  }
  const only = values.get("--only");
  return {
    confirm: flags.has("--confirm"),
    only:
      only === undefined
        ? null
        : only
            .split(",")
            .map((name) => name.trim())
            .filter(Boolean),
    replay: values.get("--replay") ?? null,
    out: values.get("--out") ?? null,
  };
}
