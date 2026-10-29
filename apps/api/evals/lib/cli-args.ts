/**
 * File: cli-args.ts
 * Purpose: Parses the eval command line and holds the batch limits: at most 12 runs, at most 2 in parallel.
 * Exports: parseArgs, CliArgs, MAX_RUNS_PER_BATCH, MAX_PARALLEL, USAGE
 * Used by: evals/cli.ts, evals/lib/plan-batch.ts
 */

export const MAX_RUNS_PER_BATCH = 12;
export const MAX_PARALLEL = 2;
/** A batch is one repetition of the selected apps; a command may repeat it up to this many times. */
export const MAX_REPEAT = 3;

export const USAGE =
  "Usage: pnpm --filter api eval -- --set tuning|holdout|fresh|<slug> [--parallel 1|2] [--repeat 1|2|3] [--confirm] [--allow-holdout] [--out <dir>]";

export type CliArgs = {
  selector: string;
  parallel: number;
  /** How many times the whole selection is run, to see how much the results vary. */
  repeat: number;
  /** Without this the command only prints the estimate and exits. */
  confirm: boolean;
  /** The holdout set is run once, at the end; this flag says that is what is happening. */
  allowHoldout: boolean;
  out: string | null;
};

const VALUE_OPTIONS = new Set(["--set", "--parallel", "--repeat", "--out"]);
const FLAG_OPTIONS = new Set(["--confirm", "--allow-holdout"]);

function parseParallel(raw: string): number {
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(
      `--parallel needs a whole number from 1 to ${MAX_PARALLEL}, got "${raw}"`,
    );
  }
  if (value > MAX_PARALLEL) {
    throw new Error(`--parallel is at most ${MAX_PARALLEL}, got ${value}`);
  }
  return value;
}

function parseRepeat(raw: string): number {
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(
      `--repeat needs a whole number from 1 to ${MAX_REPEAT}, got "${raw}"`,
    );
  }
  if (value > MAX_REPEAT) {
    throw new Error(`--repeat is at most ${MAX_REPEAT}, got ${value}`);
  }
  return value;
}

/** Throws a message that includes the usage line for anything it cannot read. */
export function parseArgs(argv: readonly string[]): CliArgs {
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
  const selector = values.get("--set");
  if (selector === undefined) throw new Error(`Missing --set. ${USAGE}`);
  return {
    selector,
    parallel: values.has("--parallel")
      ? parseParallel(values.get("--parallel") ?? "")
      : MAX_PARALLEL,
    repeat: values.has("--repeat")
      ? parseRepeat(values.get("--repeat") ?? "")
      : 1,
    confirm: flags.has("--confirm"),
    allowHoldout: flags.has("--allow-holdout"),
    out: values.get("--out") ?? null,
  };
}
