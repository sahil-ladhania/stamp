/**
 * File: library-files.test.ts
 * Purpose: Guards the committed library: every file in apps/api/library parses, is a library guide, and passes the library check, so a bad file cannot reach the seed.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { describeFailures } from "./describe-check.js";
import { readLibraryDir } from "./read-library.js";

describe("the committed library files", async () => {
  const files = await readLibraryDir();

  it("holds at least one guide", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files.map((file) => [file.slug, file] as const))(
    "%s passes the library check",
    (_slug, file) => {
      expect(describeFailures(file.check.failures)).toEqual([]);
      expect(file.check.guide?.mode).toBe("library");
    },
  );
});
