/**
 * File: queries-retry.test.ts
 * Purpose: Tests the retry wording for an unknown review gate and for blockers, and that a retry makes at most three queries.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { retryQueries } from "./queries.js";

describe("retryQueries for the review gate and blockers", () => {
  it("asks who reviews apps when the review gate is unknown, under the review topic", () => {
    const [query] = retryQueries("Acme", ["reviewGate"]);
    expect(query?.topic).toBe("review");
    expect(query?.text).toMatch(/Acme/);
    expect(query?.text).toMatch(/review/i);
  });

  it("words the review-gate retry differently from the blockers retry", () => {
    const [gate] = retryQueries("Acme", ["reviewGate"]);
    const [blockers] = retryQueries("Acme", ["blockers"]);
    expect(gate?.text).not.toBe(blockers?.text);
  });

  it("makes at most three queries, the review gate first", () => {
    const queries = retryQueries("Acme", [
      "reviewGate",
      "steps",
      "scopes",
      "blockers",
    ]);
    expect(queries).toHaveLength(3);
    expect(queries[0]?.topic).toBe("review");
  });
});
