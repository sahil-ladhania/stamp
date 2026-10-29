/**
 * File: order-results-locales.test.ts
 * Purpose: Tests that the same page in several languages becomes one search result, the English one, with every topic that found it.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { hit } from "../../test-support/node-fixtures.js";
import { toSearchResults } from "./order-results.js";

describe("toSearchResults across languages", () => {
  it("keeps one result for the same page in several languages, the English one, with every topic that found it", () => {
    const results = toSearchResults(
      [
        {
          ...hit("https://www.acme.com/es-es/help/snowflake", 0.9),
          topic: "setup",
        },
        { ...hit("https://www.acme.com/help/snowflake", 0.8), topic: "review" },
        {
          ...hit("https://www.acme.com/zh-cn/help/snowflake", 0.7),
          topic: "limits",
        },
      ],
      "acme.com",
    );
    expect(results).toHaveLength(1);
    expect(results[0]?.url).toBe("https://www.acme.com/help/snowflake");
    expect([...(results[0]?.topics ?? [])].sort()).toEqual([
      "limits",
      "review",
      "setup",
    ]);
  });

  it("keeps the first of several variants when none is English", () => {
    const results = toSearchResults(
      [hit("https://acme.com/fr/a", 0.9), hit("https://acme.com/de/a", 0.8)],
      "acme.com",
    );
    expect(results.map((r) => r.url)).toEqual(["https://acme.com/fr/a"]);
  });
});
