/**
 * File: library-args.test.ts
 * Purpose: Tests the library script command lines: required options, the pnpm double dash, repeated slugs, unknown options.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { parseExportArgs, parseSeedArgs } from "./library-args.js";

describe("parseExportArgs", () => {
  it("reads the run folder and the apps, and leaves --out unset", () => {
    expect(
      parseExportArgs([
        "--",
        "--run",
        "evals/runs/x",
        "--apps",
        "github, hubspot",
      ]),
    ).toEqual({
      runDir: "evals/runs/x",
      slugs: ["github", "hubspot"],
      outDir: null,
    });
  });

  it("reads --name=value, --out, and names each app once", () => {
    expect(parseExportArgs(["--run=r", "--apps=a,a,b", "--out=o"])).toEqual({
      runDir: "r",
      slugs: ["a", "b"],
      outDir: "o",
    });
  });

  it.each([
    [["--apps", "a"], /Missing --run/],
    [["--run", "r"], /Missing --apps/],
    [["--run", "r", "--apps", " , "], /Missing --apps/],
    [["--run", "r", "--apps"], /--apps needs a value/],
    [["--run", "r", "--apps", "a", "--all"], /Unknown option --all/],
  ])("rejects %j", (argv, message) => {
    expect(() => parseExportArgs(argv)).toThrow(message);
  });
});

describe("parseSeedArgs", () => {
  it("writes by default and only validates with --dry-run", () => {
    expect(parseSeedArgs([])).toEqual({ dryRun: false });
    expect(parseSeedArgs(["--", "--dry-run"])).toEqual({ dryRun: true });
  });

  it("rejects an option it does not know instead of seeding", () => {
    expect(() => parseSeedArgs(["--dryrun"])).toThrow(
      /Unknown option --dryrun/,
    );
  });
});
