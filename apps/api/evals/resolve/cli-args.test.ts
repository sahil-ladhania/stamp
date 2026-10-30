/**
 * File: cli-args.test.ts
 * Purpose: Tests the resolve stress command line: it runs only with --confirm, and unknown options stop it.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { parseResolveArgs } from "./cli-args.js";

describe("parseResolveArgs", () => {
  it("does not confirm by default", () => {
    expect(parseResolveArgs([])).toEqual({
      confirm: false,
      only: null,
      replay: null,
      out: null,
    });
  });

  it("reads the flags, the pnpm double dash and a name list", () => {
    expect(
      parseResolveArgs([
        "--",
        "--confirm",
        "--only",
        "Spotify, Box",
        "--replay=runs/x",
        "--out",
        "o",
      ]),
    ).toEqual({
      confirm: true,
      only: ["Spotify", "Box"],
      replay: "runs/x",
      out: "o",
    });
  });

  it.each([["--conf"], ["--only"]])("rejects %s", (...argv) => {
    expect(() => parseResolveArgs(argv)).toThrow(/Usage/);
  });
});
