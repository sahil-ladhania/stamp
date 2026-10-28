/**
 * File: decisions-end.test.ts
 * Purpose: Tests how extraction ends (NO_PUBLIC_DOCS versus INTERNAL, NOT_OAUTH) and which sections a retry redoes.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { PAGES, claim } from "../../test-support/extract-fixtures.js";
import { pageRecord } from "../../test-support/node-fixtures.js";
import type { Drafts } from "../state.js";
import { endOfExtract, retrySections } from "./decisions.js";
import type { SectionOutput } from "./sections.js";

const KEYS_TEXT =
  "Authenticate every request with an API key in the Authorization header. OAuth is not supported by this API.";
const KEYS_URL = "https://docs.acme.com/auth";
const keysPage = pageRecord(KEYS_URL, "official", KEYS_TEXT);
const keyEvidence = claim(
  KEYS_URL,
  "Authenticate every request with an API key in the Authorization header.",
);
const gates = (
  over: Partial<SectionOutput<"gates">> = {},
): SectionOutput<"gates"> => ({
  authMethod: "api_key_only",
  authEvidence: keyEvidence,
  reviewGate: "unknown",
  reviewGateEvidence: null,
  approvalWait: "unknown",
  approvalWaitMinDays: null,
  approvalWaitMaxDays: null,
  approvalWaitEvidence: null,
  prerequisites: [],
  hiddenLimits: [],
  enterprisePlanEvidence: null,
  ...over,
});
const pages = [keysPage, ...PAGES];
const drafted: Drafts = {
  steps: { status: "drafted", payload: { steps: [] } },
};

describe("endOfExtract", () => {
  it("ends the run with NOT_OAUTH when that is decided", () => {
    expect(endOfExtract(gates(), {}, pages)).toMatchObject({
      stage: 4,
      code: "NOT_OAUTH",
    });
  });

  it("goes on when something was drafted", () => {
    expect(endOfExtract(null, drafted, pages)).toBeNull();
  });

  it("goes on when only the gates found something", () => {
    expect(
      endOfExtract(
        gates({ authMethod: "oauth" }),
        { steps: { status: "unknown" } },
        pages,
      ),
    ).toBeNull();
  });

  it("ends the run with NO_PUBLIC_DOCS when every section answered unknown", () => {
    const allUnknown: Drafts = {
      steps: { status: "unknown" },
      scopes: { status: "unknown" },
      limits: { status: "unknown" },
    };
    expect(endOfExtract(null, allUnknown, pages)).toMatchObject({
      stage: 4,
      code: "NO_PUBLIC_DOCS",
    });
  });

  it("ends the run with NO_PUBLIC_DOCS when some sections are unknown and the rest failed", () => {
    expect(
      endOfExtract(
        null,
        {
          steps: { status: "unknown" },
          scopes: { status: "failed", reason: "timeout" },
        },
        pages,
      ),
    ).toMatchObject({ code: "NO_PUBLIC_DOCS" });
  });

  it("ends the run with INTERNAL, not NO_PUBLIC_DOCS, when every section failed", () => {
    const failed: Drafts = {
      steps: { status: "failed", reason: "model_error" },
      scopes: { status: "failed", reason: "timeout" },
    };
    expect(endOfExtract(null, failed, pages)).toMatchObject({
      stage: 4,
      code: "INTERNAL",
    });
  });

  it("ends the run with NO_PUBLIC_DOCS when no section ran at all", () => {
    expect(endOfExtract(null, {}, pages)).toMatchObject({
      code: "NO_PUBLIC_DOCS",
    });
  });
});

describe("retrySections", () => {
  it("redoes the sections verify reported, in a fixed order, and ignores unknown names", () => {
    expect(retrySections(["scopes", "steps", "verdict", "nonsense"])).toEqual({
      sections: ["steps", "scopes"],
      redoVerdict: true,
    });
  });

  it("redoes the verdict when steps or blockers are redone, not for scopes alone", () => {
    expect(retrySections(["scopes"])).toEqual({
      sections: ["scopes"],
      redoVerdict: false,
    });
    expect(retrySections(["blockers"])).toEqual({
      sections: ["blockers"],
      redoVerdict: true,
    });
    expect(retrySections(["limits", "requirements"]).redoVerdict).toBe(false);
  });

  it("redoes nothing for no known section", () => {
    expect(retrySections([])).toEqual({ sections: [], redoVerdict: false });
    expect(retrySections(["verdict"])).toEqual({
      sections: [],
      redoVerdict: false,
    });
  });
});
