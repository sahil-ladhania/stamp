/**
 * File: agent-failure.test.ts
 * Purpose: Tests the failure builder: standard message per code, options only when given.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { RUN_ERROR_MESSAGES } from "../services/run-messages.js";
import { makeFailure } from "./agent-failure.js";

describe("makeFailure", () => {
  it.each([
    "AMBIGUOUS_APP",
    "NOT_OAUTH",
    "NO_PUBLIC_DOCS",
    "INTERNAL",
  ] as const)("uses the standard message for %s", (code) => {
    expect(makeFailure(3, code)).toEqual({
      stage: 3,
      code,
      message: RUN_ERROR_MESSAGES[code],
    });
  });

  it("carries the did-you-mean options when given", () => {
    const options = [{ name: "Linear", domain: "linear.app" }];
    expect(makeFailure(0, "AMBIGUOUS_APP", options)).toMatchObject({ options });
  });

  it("leaves the options key out when none are given", () => {
    expect("options" in makeFailure(0, "INTERNAL")).toBe(false);
  });
});
