/**
 * File: error-text.test.ts
 * Purpose: Tests that error text shows the name and message and never the cause.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { errorText } from "./error-text.js";

describe("errorText", () => {
  it("is the error's name and message", () => {
    expect(errorText(new TypeError("bad input"))).toBe("TypeError: bad input");
  });

  it("uses a custom error name", () => {
    expect(
      errorText(Object.assign(new Error("slow"), { name: "TimeoutError" })),
    ).toBe("TimeoutError: slow");
  });

  it("leaves out the cause, which can hold request headers", () => {
    const err = new Error("call failed", {
      cause: { headers: { authorization: "Bearer sk-secret" } },
    });
    expect(errorText(err)).toBe("Error: call failed");
  });

  it("does not print a thrown non-error", () => {
    expect(errorText("sk-secret")).toBe("unknown error");
    expect(errorText(undefined)).toBe("unknown error");
  });
});
