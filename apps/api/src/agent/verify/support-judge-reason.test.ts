/**
 * File: support-judge-reason.test.ts
 * Purpose: Tests which verdicts take a label away and with which reason: partly or unsupported, or a page about another product.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { reasonOf } from "./support-judge.js";

describe("reasonOf", () => {
  it.each([
    [{ support: "supported", aboutProduct: "yes" }, null],
    [{ support: "supported", aboutProduct: "unsure" }, null],
    [{ support: "partly", aboutProduct: "yes" }, "not_supported"],
    [{ support: "unsupported", aboutProduct: "yes" }, "not_supported"],
    [{ support: "supported", aboutProduct: "no" }, "off_product"],
    [{ support: "unsupported", aboutProduct: "no" }, "off_product"],
  ] as const)("%j gives %s", (verdict, reason) => {
    expect(reasonOf(verdict)).toBe(reason);
  });
});
