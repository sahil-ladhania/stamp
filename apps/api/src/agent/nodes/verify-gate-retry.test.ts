/**
 * File: verify-gate-retry.test.ts
 * Purpose: Tests that an unknown review gate, or one whose evidence did not verify, is reported to the retry.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it, vi } from "vitest";
import { logger } from "../../lib/logger.js";
import { REVIEW_URL, claim } from "../../test-support/extract-fixtures.js";
import { GATES_OUTPUT } from "../../test-support/extract-replies.js";
import { verify } from "../../test-support/verify-helpers.js";

vi.spyOn(logger, "info").mockImplementation(() => {});

const FAKE = "A sentence the page never contained at all.";

describe("verifyNode and the review gate", () => {
  it("reports the review gate as missing when there are no gates or its evidence did not verify, which triggers the retry", async () => {
    expect((await verify()).update.missingSections).toEqual(["reviewGate"]);
    const bad = {
      ...GATES_OUTPUT,
      reviewGateEvidence: claim(REVIEW_URL, FAKE),
    };
    expect((await verify({ gates: bad })).update.missingSections).toEqual([
      "reviewGate",
    ]);
  });
});
