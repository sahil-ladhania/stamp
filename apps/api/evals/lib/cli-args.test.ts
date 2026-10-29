/**
 * File: cli-args.test.ts
 * Purpose: Tests parsing the eval command line: the set selector, the parallel limit, the confirm and holdout flags, and the usage errors.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { MAX_PARALLEL, MAX_REPEAT, parseArgs } from "./cli-args.js";

describe("parseArgs", () => {
  it("reads the set and defaults to a dry run with two in parallel", () => {
    expect(parseArgs(["--set", "tuning"])).toEqual({
      selector: "tuning",
      parallel: 2,
      repeat: 1,
      confirm: false,
      allowHoldout: false,
      out: null,
    });
  });

  it("reads --repeat from 1 to 3 and nothing else", () => {
    expect(parseArgs(["--set", "tuning", "--repeat", "3"]).repeat).toBe(3);
    expect(MAX_REPEAT).toBe(3);
    expect(() => parseArgs(["--set", "tuning", "--repeat", "4"])).toThrow(
      /at most 3/,
    );
    expect(() => parseArgs(["--set", "tuning", "--repeat", "0"])).toThrow(
      /whole number from 1/,
    );
    expect(() => parseArgs(["--set", "tuning", "--repeat", "many"])).toThrow(
      /whole number from 1/,
    );
  });

  it("accepts --set=value and an app slug", () => {
    expect(parseArgs(["--set=gmail"]).selector).toBe("gmail");
  });

  it("ignores the lone -- that pnpm passes through", () => {
    expect(parseArgs(["--", "--set", "tuning"]).selector).toBe("tuning");
  });

  it("reads the confirm and holdout flags and an output folder", () => {
    const args = parseArgs([
      "--set",
      "holdout",
      "--confirm",
      "--allow-holdout",
      "--out",
      "/tmp/x",
    ]);
    expect(args).toMatchObject({
      confirm: true,
      allowHoldout: true,
      out: "/tmp/x",
    });
  });

  it("accepts one or two parallel runs and nothing else", () => {
    expect(parseArgs(["--set", "tuning", "--parallel", "1"]).parallel).toBe(1);
    expect(MAX_PARALLEL).toBe(2);
    expect(() => parseArgs(["--set", "tuning", "--parallel", "3"])).toThrow(
      /at most 2/,
    );
    expect(() => parseArgs(["--set", "tuning", "--parallel", "0"])).toThrow(
      /whole number from 1/,
    );
    expect(() => parseArgs(["--set", "tuning", "--parallel", "two"])).toThrow(
      /whole number from 1/,
    );
  });

  it("explains how to use the command when --set is missing", () => {
    expect(() => parseArgs([])).toThrow(/--set tuning\|holdout\|<slug>/);
  });

  it("rejects a flag it does not know", () => {
    expect(() => parseArgs(["--set", "tuning", "--yes"])).toThrow(
      /Unknown option --yes/,
    );
  });

  it("rejects an option that is missing its value", () => {
    expect(() => parseArgs(["--set"])).toThrow(/--set needs a value/);
  });
});
