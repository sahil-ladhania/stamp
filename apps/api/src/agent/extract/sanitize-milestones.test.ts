/**
 * File: sanitize-milestones.test.ts
 * Purpose: Tests that a milestone's text is written by code from the time its quote states, and that a quote with no time leaves the field unknown.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import {
  OAUTH_URL,
  PAGE_INDEX,
  REVIEW_URL,
  claim,
} from "../../test-support/extract-fixtures.js";
import { sanitizeSection } from "./sanitize.js";

const ctx = { pages: PAGE_INDEX };
const clean = (over: Record<string, unknown>) =>
  sanitizeSection(
    "milestones",
    {
      firstTestEffort: null,
      firstTestWait: null,
      productionEffort: null,
      productionWait: null,
      ...over,
    } as never,
    ctx,
  ).output;

describe("sanitizeSection milestones", () => {
  it("replaces the model's prose with the time the quote states, keeping the quote and the URL", () => {
    const out = clean({
      productionWait: claim(
        REVIEW_URL,
        "Review usually takes 5 to 7 business days.",
        "Approval is a slow process that needs patience.",
      ),
    });
    expect(out.productionWait).toEqual({
      text: "5 to 7 business days",
      quote: "Review usually takes 5 to 7 business days.",
      url: REVIEW_URL,
    });
  });

  it("makes a field unknown when its quote states no time, however good the prose", () => {
    const out = clean({
      firstTestEffort: claim(
        OAUTH_URL,
        "Copy the client ID and the client secret.",
        "About 10 minutes.",
      ),
    });
    expect(out.firstTestEffort).toBeNull();
  });

  it("decides each of the four fields on its own", () => {
    const out = clean({
      firstTestEffort: claim(OAUTH_URL, "Setup takes 15 minutes.", "x"),
      firstTestWait: claim(OAUTH_URL, "Nothing to wait for.", "x"),
      productionEffort: claim(OAUTH_URL, "Allow two weeks to prepare.", "x"),
      productionWait: claim(REVIEW_URL, "Review takes up to 6 weeks.", "x"),
    });
    expect([
      out.firstTestEffort?.text,
      out.firstTestWait?.text,
      out.productionEffort?.text,
      out.productionWait?.text,
    ]).toEqual(["15 minutes", undefined, "2 weeks", "up to 6 weeks"]);
  });

  it("still drops a claim whose page was not fetched, and counts it", () => {
    const stray = claim(
      "https://elsewhere.example/p",
      "Review takes 5 days.",
      "x",
    );
    const cleaned = sanitizeSection(
      "milestones",
      {
        firstTestEffort: stray,
        firstTestWait: null,
        productionEffort: null,
        productionWait: null,
      },
      ctx,
    );
    expect(cleaned.output.firstTestEffort).toBeNull();
    expect(cleaned.dropped).toBe(1);
  });
});
