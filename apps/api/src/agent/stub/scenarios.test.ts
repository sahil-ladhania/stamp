/**
 * File: scenarios.test.ts
 * Purpose: Tests that the stub scenario is chosen from the run slug.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { slugify } from "../../utils/slugify.js";
import { scenarioFor } from "./scenarios.js";

describe("scenarioFor", () => {
  it.each([
    ["stub-error", "error"],
    ["stub-partial", "partial"],
    ["stub-ambiguous", "ambiguous"],
    ["stub-notoauth", "notoauth"],
  ])("maps %s to the %s scenario", (slug, scenario) => {
    expect(scenarioFor(slug)).toBe(scenario);
  });

  it("matches however the tester typed the name, because it works on the slug", () => {
    for (const typed of ["Stub Error", "STUB-ERROR", "  stub_error  "]) {
      expect(scenarioFor(slugify(typed))).toBe("error");
    }
  });

  it("uses the default run for every other app", () => {
    for (const slug of ["notion", "stub", "stub-errors", "stub-unknown"]) {
      expect(scenarioFor(slug)).toBe("default");
    }
  });

  it("never matches inherited object properties", () => {
    for (const slug of [
      "constructor",
      "__proto__",
      "toString",
      "hasOwnProperty",
    ]) {
      expect(scenarioFor(slug)).toBe("default");
    }
  });
});
