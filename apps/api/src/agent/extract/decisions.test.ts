/**
 * File: decisions.test.ts
 * Purpose: Tests every condition of the NOT_OAUTH decision.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { PAGES, claim } from "../../test-support/extract-fixtures.js";
import { pageRecord } from "../../test-support/node-fixtures.js";
import type { Drafts } from "../state.js";
import { decideNotOauth } from "./decisions.js";
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

describe("decideNotOauth", () => {
  it("is true when the model says API keys only, an official quote proves it, and no steps or scopes were found", () => {
    expect(decideNotOauth(gates(), {}, pages)).toBe(true);
    expect(
      decideNotOauth(
        gates(),
        {
          steps: { status: "unknown" },
          scopes: { status: "failed", reason: "timeout" },
        },
        pages,
      ),
    ).toBe(true);
  });

  it.each(["oauth", "both", "unknown"] as const)(
    "is false when the auth method is %s",
    (authMethod) => {
      expect(decideNotOauth(gates({ authMethod }), {}, pages)).toBe(false);
    },
  );

  it("is false with no gates or no evidence", () => {
    expect(decideNotOauth(null, {}, pages)).toBe(false);
    expect(decideNotOauth(gates({ authEvidence: null }), {}, pages)).toBe(
      false,
    );
  });

  it("is false when the evidence page is not official", () => {
    const blog = pageRecord(KEYS_URL, "third_party", KEYS_TEXT);
    expect(decideNotOauth(gates(), {}, [blog])).toBe(false);
  });

  it("is false when the quote is not in the page: an unverified quote proves nothing", () => {
    expect(
      decideNotOauth(
        gates({
          authEvidence: claim(
            KEYS_URL,
            "This API never supports OAuth at all.",
          ),
        }),
        {},
        pages,
      ),
    ).toBe(false);
  });

  it("is false when the evidence page was not fetched", () => {
    expect(
      decideNotOauth(
        gates({
          authEvidence: claim("https://docs.acme.com/other", keyEvidence.quote),
        }),
        {},
        pages,
      ),
    ).toBe(false);
    expect(
      decideNotOauth(
        gates({ authEvidence: claim("not a url", keyEvidence.quote) }),
        {},
        pages,
      ),
    ).toBe(false);
  });

  it("is false when the steps or the scopes section found OAuth content", () => {
    expect(decideNotOauth(gates(), drafted, pages)).toBe(false);
    expect(
      decideNotOauth(
        gates(),
        { scopes: { status: "drafted", payload: { scopes: [] } } },
        pages,
      ),
    ).toBe(false);
  });

  it("finds the page whatever form the evidence URL is written in", () => {
    expect(
      decideNotOauth(
        gates({ authEvidence: claim(`${KEYS_URL}#top`, keyEvidence.quote) }),
        {},
        pages,
      ),
    ).toBe(true);
  });
});
