/**
 * File: routes-verify-guard.test.ts
 * Purpose: Tests that a failed budget check on verify itself goes to score and not to verify again, which would loop.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it, vi } from "vitest";
import { createHarness, makeState } from "../test-support/graph-harness.js";
import { DRAFTS } from "../test-support/guide-fixtures.js";

// Verify's real minimum is 0, so its check never fails; this makes it fail to prove the guard.
vi.mock("./budget.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./budget.js")>()),
  checkBudget: () => ({ ok: false, reason: "time_budget" }),
}));
const { routeTo } = await import("./routes.js");

describe("routeTo(verify) when its own check fails", () => {
  it("goes to score even with unchecked drafts", () => {
    const h = createHarness();
    expect(routeTo("verify")(makeState({ drafts: DRAFTS }), h.config)).toBe(
      "score",
    );
  });

  it("still goes to verify from another node in the same situation", () => {
    const h = createHarness();
    expect(routeTo("probe")(makeState({ drafts: DRAFTS }), h.config)).toBe(
      "verify",
    );
  });
});
