/**
 * File: verdict-context.test.ts
 * Purpose: Tests the numbered steps and blockers lists the verdict picks from.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import {
  OAUTH_URL,
  QUOTES,
  claim,
} from "../../test-support/extract-fixtures.js";
import type { Drafts } from "../state.js";
import { verdictContext } from "./verdict-context.js";

const step = (title: string) => ({
  title,
  detail: claim(OAUTH_URL, QUOTES.secret),
  actor: "human" as const,
  effort: null,
});
const blocker = (text: string) => ({
  symptom: claim(OAUTH_URL, QUOTES.cap, text),
  cause: null,
  fix: null,
  contact: null,
});

describe("verdictContext", () => {
  it("numbers the steps and blockers from 0 and counts them", () => {
    const drafts: Drafts = {
      steps: {
        status: "drafted",
        payload: {
          steps: [step("Create the app"), step("Add a redirect URI")],
        },
      },
      blockers: {
        status: "drafted",
        payload: { blockers: [blocker("Redirect URI mismatch")] },
      },
    };
    expect(verdictContext(drafts)).toEqual({
      context:
        "Steps:\n0. Create the app\n1. Add a redirect URI\n\nBlockers:\n0. Redirect URI mismatch",
      stepCount: 2,
      blockerCount: 1,
    });
  });

  it("says none found for a section that is unknown, failed or missing", () => {
    expect(
      verdictContext({
        steps: { status: "unknown" },
        blockers: { status: "failed", reason: "timeout" },
      }),
    ).toEqual({
      context: "Steps: none found\n\nBlockers: none found",
      stepCount: 0,
      blockerCount: 0,
    });
    expect(verdictContext({}).stepCount).toBe(0);
  });
});
