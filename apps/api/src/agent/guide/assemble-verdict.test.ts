/**
 * File: assemble-verdict.test.ts
 * Purpose: Tests the verdict's step and blocker pointers: a position with nothing behind it becomes null.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { assembleInput } from "../../test-support/assemble-helpers.js";
import {
  OAUTH_URL,
  QUOTES,
  claim,
} from "../../test-support/extract-fixtures.js";
import { VERDICT_OUTPUT } from "../../test-support/extract-replies.js";
import { drafted, withDrafts } from "../../test-support/guide-fixtures.js";
import { assembleGuide } from "./assemble.js";

const verdict = (over: Partial<typeof VERDICT_OUTPUT>) =>
  assembleGuide(
    assembleInput({
      drafts: withDrafts({
        verdict: drafted<"verdict">({ ...VERDICT_OUTPUT, ...over }),
      }),
    }),
  ).verdict;

describe("verdict pointers", () => {
  it("points at the step and blocker by position", () => {
    expect(verdict({})).toMatchObject({
      nextStepId: "steps.0",
      topBlockerId: "blockers.0",
    });
  });

  it.each([
    ["past the end", 5],
    ["negative", -1],
    ["missing", null],
  ])("is null for a position that is %s", (_name, index) => {
    expect(
      verdict({
        nextStepIndex: index as never,
        topBlockerIndex: index as never,
      }),
    ).toMatchObject({ nextStepId: null, topBlockerId: null });
  });

  it("is null when there are no steps or blockers to point at", () => {
    const empty = withDrafts({
      steps: drafted<"steps">({ steps: [] }),
      blockers: drafted<"blockers">({ blockers: [] }),
    });
    const guide = assembleGuide(assembleInput({ drafts: empty }));
    expect(guide.verdict).toMatchObject({
      nextStepId: null,
      topBlockerId: null,
    });
  });

  it("keeps an unverified summary Uncertain with no source", () => {
    const summary = claim(
      OAUTH_URL,
      "Nothing like this is on the page.",
      "Easy.",
    );
    expect(verdict({ summary })).toMatchObject({
      summary: { text: "Easy.", label: "uncertain", sources: [] },
    });
    expect(verdict({}).summary.sources[0]?.quote).toBe(QUOTES.secret);
  });
});
