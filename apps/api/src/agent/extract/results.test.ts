/**
 * File: results.test.ts
 * Purpose: Tests turning section results into drafts, gates, the partial flag and plain log rows.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import {
  GATES_OUTPUT,
  STEPS_OUTPUT,
} from "../../test-support/extract-replies.js";
import { collectResults, logRows } from "./results.js";
import type { SectionResult } from "./section-types.js";
import type { SectionId } from "./sections.js";

const result = (
  section: SectionId,
  over: Partial<SectionResult<SectionId>> = {},
): SectionResult<SectionId> => ({
  section,
  status: "unknown",
  reason: "nothing_found",
  output: null,
  calls: 1,
  repaired: false,
  durationMs: 4_000,
  inputTokens: 1_000,
  outputTokens: 200,
  dropped: 0,
  excerptChars: 5_000,
  ...over,
});

describe("collectResults", () => {
  it("makes a drafted section a draft with its payload", () => {
    const { drafts } = collectResults([
      result("steps", {
        status: "drafted",
        reason: null,
        output: STEPS_OUTPUT,
      }),
    ]);
    expect(drafts).toEqual({
      steps: { status: "drafted", payload: STEPS_OUTPUT },
    });
  });

  it("makes an unknown section unknown and a failed one failed with its reason", () => {
    const { drafts } = collectResults([
      result("scopes"),
      result("limits", { status: "failed", reason: "timeout" }),
    ]);
    expect(drafts).toEqual({
      scopes: { status: "unknown" },
      limits: { status: "failed", reason: "timeout" },
    });
  });

  it("keeps the gates result out of the drafts and returns it separately", () => {
    const collected = collectResults([
      result("gates", {
        status: "drafted",
        reason: null,
        output: GATES_OUTPUT,
      }),
    ]);
    expect(collected.drafts).toEqual({});
    expect(collected.gates).toEqual(GATES_OUTPUT);
  });

  it("returns null gates when the gates section was unknown or failed, and undefined when it did not run", () => {
    expect(collectResults([result("gates")]).gates).toBeNull();
    expect(
      collectResults([
        result("gates", { status: "failed", reason: "model_error" }),
      ]).gates,
    ).toBeNull();
    expect(collectResults([result("steps")]).gates).toBeUndefined();
  });

  it("is partial only when a section ran out of time", () => {
    expect(
      collectResults([
        result("steps", { status: "failed", reason: "time_budget" }),
      ]).partial,
    ).toBe(true);
    expect(
      collectResults([result("steps", { status: "failed", reason: "timeout" })])
        .partial,
    ).toBe(false);
    expect(collectResults([]).partial).toBe(false);
  });
});

describe("logRows", () => {
  it("gives counts, tokens and timings per section and nothing else", () => {
    expect(
      logRows([
        result("steps", {
          status: "drafted",
          reason: null,
          output: STEPS_OUTPUT,
          repaired: true,
          dropped: 2,
        }),
      ]),
    ).toEqual([
      {
        section: "steps",
        status: "drafted",
        reason: null,
        calls: 1,
        repaired: true,
        durationMs: 4_000,
        inputTokens: 1_000,
        outputTokens: 200,
        excerptChars: 5_000,
        dropped: 2,
      },
    ]);
  });

  it("does not include the extracted text", () => {
    const rows = JSON.stringify(
      logRows([
        result("steps", {
          status: "drafted",
          reason: null,
          output: STEPS_OUTPUT,
        }),
      ]),
    );
    expect(rows).not.toContain("client secret");
  });
});
