/**
 * File: verify-claims-trust.test.ts
 * Purpose: Tests the trust checks inside the claim check: a legacy page, third-party scope names and an unsupported number each turn a Sourced claim into Uncertain with no source and a reason.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import {
  OAUTH_TEXT,
  OAUTH_URL,
  PAGES,
  QUOTES,
  REVIEW_URL,
  claim,
} from "../../test-support/extract-fixtures.js";
import { pageRecord } from "../../test-support/node-fixtures.js";
import { indexPages } from "../extract/sanitize.js";
import type { ClaimSlot } from "../guide/claim-slots.js";
import { verifyClaims } from "./verify-claims.js";

const THIRD_URL = "https://blog.example.net/acme-scopes";
const INDEX = indexPages([
  ...PAGES,
  pageRecord(THIRD_URL, "third_party", OAUTH_TEXT),
]);
const slot = (
  id: string,
  url = OAUTH_URL,
  text = "A fact from the page.",
  quote: string = QUOTES.secret,
  kind: ClaimSlot["kind"] = "fact",
): ClaimSlot => ({ id, draft: claim(url, quote, text), kind });
const run = (slots: ClaimSlot[], titles: Record<string, string> = {}) =>
  verifyClaims(slots, INDEX, new Set(), { titleOf: (url) => titles[url] });

describe("verifyClaims trust checks", () => {
  it("makes a claim on a legacy page Uncertain with no source, keeping its text", () => {
    const { claims, outcomes } = run([slot("steps.0.detail")], {
      [OAUTH_URL]: "Legacy OAuth guide",
    });
    expect(claims[0]).toMatchObject({
      id: "steps.0.detail",
      text: "A fact from the page.",
      label: "uncertain",
      sources: [],
    });
    expect(outcomes[0]).toMatchObject({
      label: "uncertain",
      downgrade: "stale_source",
    });
  });

  it("makes scope names from a third-party page Uncertain, and the same claim elsewhere stays Sourced", () => {
    const scope = slot(
      "scopes.0.reason",
      THIRD_URL,
      "contacts.read reads contacts.",
      QUOTES.scope,
    );
    const step = slot("steps.0.detail", THIRD_URL);
    const { outcomes } = run([scope, step]);
    expect(outcomes.map((o) => [o.label, o.downgrade])).toEqual([
      ["uncertain", "third_party_only"],
      ["sourced", null],
    ]);
  });

  it("makes a claim with a number its quote does not hold Uncertain", () => {
    const { claims, outcomes } = run([
      slot(
        "limits.0",
        OAUTH_URL,
        "Apps are limited to 500 installs.",
        QUOTES.cap,
      ),
    ]);
    expect(outcomes[0]).toMatchObject({
      label: "uncertain",
      downgrade: "not_supported",
    });
    expect(claims[0]?.sources).toEqual([]);
  });

  it("keeps a claim Sourced when the page is current and its quote holds the figures", () => {
    const { outcomes } = run(
      [
        slot(
          "limits.0",
          OAUTH_URL,
          "Each app can be installed on up to 25 accounts.",
          QUOTES.cap,
        ),
      ],
      { [OAUTH_URL]: "Create an OAuth app" },
    );
    expect(outcomes[0]).toMatchObject({ label: "sourced", downgrade: null });
  });

  it("leaves a missing quote as quote_not_found, whatever the page is", () => {
    const { outcomes } = run(
      [
        slot(
          "steps.0.detail",
          OAUTH_URL,
          "x",
          "A sentence the page never had.",
        ),
      ],
      { [OAUTH_URL]: "Legacy OAuth guide" },
    );
    expect(outcomes[0]?.downgrade).toBe("quote_not_found");
  });

  it("reports no trust downgrade for a time estimate, which is Uncertain by rule", () => {
    const { outcomes } = run(
      [
        slot(
          "milestones.production.wait",
          REVIEW_URL,
          "Takes 99 days.",
          QUOTES.review,
          "estimate",
        ),
      ],
      { [REVIEW_URL]: "Legacy app review" },
    );
    expect(outcomes[0]).toMatchObject({ label: "uncertain", downgrade: null });
  });

  it("works without a context, as before", () => {
    const { outcomes } = verifyClaims(
      [slot("steps.0.detail")],
      INDEX,
      new Set(),
    );
    expect(outcomes[0]?.label).toBe("sourced");
  });
});
