/**
 * File: verify-claims.test.ts
 * Purpose: Tests every label path of the claim check: sourced, quote not found, sources disagree, time estimate and the page that was not fetched.
 * Exports: (none)
 * Used by: vitest
 */
import { ClaimSchema } from "@stamp/schema";
import { describe, expect, it } from "vitest";
import {
  OAUTH_URL,
  PAGES,
  PAGE_INDEX,
  QUOTES,
  claim,
} from "../../test-support/extract-fixtures.js";
import { DRAFTS } from "../../test-support/guide-fixtures.js";
import { claimSlots, type ClaimSlot } from "../guide/claim-slots.js";
import { verifyClaims } from "./verify-claims.js";
import { conflictKey } from "./verify-conflicts.js";

const NONE = new Set<string>();
const fact = (
  id: string,
  draft = claim(OAUTH_URL, QUOTES.secret),
): ClaimSlot => ({ id, draft, kind: "fact" });
const run = (slots: ClaimSlot[], conflicted = NONE) =>
  verifyClaims(slots, PAGE_INDEX, conflicted);

describe("verifyClaims", () => {
  it("labels a fact whose quote is on its page as Sourced, citing that page with its tier and fetch time", () => {
    const { claims, outcomes } = run([fact("steps.0.detail")]);
    expect(claims[0]).toMatchObject({ id: "steps.0.detail", label: "sourced" });
    expect(claims[0]?.sources).toEqual([
      {
        url: OAUTH_URL,
        quote: QUOTES.secret,
        tier: "official",
        retrievedAt: PAGES[0]?.fetchedAt,
      },
    ]);
    expect(outcomes[0]).toEqual({
      id: "steps.0.detail",
      label: "sourced",
      downgrade: null,
      url: OAUTH_URL,
    });
  });

  it("downgrades a fact whose quote is not on the page to Uncertain with no source, keeping its text", () => {
    const slot = fact(
      "limits.0",
      claim(
        OAUTH_URL,
        "Every app may have a million installs.",
        "Unlimited installs.",
      ),
    );
    const { claims, outcomes } = run([slot]);
    expect(claims[0]).toEqual({
      id: "limits.0",
      text: "Unlimited installs.",
      label: "uncertain",
      sources: [],
    });
    expect(outcomes[0]?.downgrade).toBe("quote_not_found");
  });

  it("downgrades a fact that cites a page that was never fetched", () => {
    const slot = fact(
      "limits.0",
      claim("https://elsewhere.example.com/x", QUOTES.cap),
    );
    const { claims, outcomes, checks } = run([slot]);
    expect(claims[0]).toMatchObject({ label: "uncertain", sources: [] });
    expect(outcomes[0]?.downgrade).toBe("quote_not_found");
    expect(checks[0]).toMatchObject({
      result: "fail",
      detail: { reason: "page_not_fetched" },
    });
  });

  it("keeps a time estimate Uncertain even with a real quote, keeps its source and reports no downgrade", () => {
    const slot: ClaimSlot = {
      id: "milestones.production.wait",
      draft: claim(OAUTH_URL, QUOTES.cap),
      kind: "estimate",
    };
    const { claims, outcomes } = run([slot]);
    expect(claims[0]).toMatchObject({ label: "uncertain" });
    expect(claims[0]?.sources).toHaveLength(1);
    expect(outcomes[0]?.downgrade).toBeNull();
  });

  it("downgrades a time estimate whose quote is not found, and says so", () => {
    const slot: ClaimSlot = {
      id: "milestones.production.wait",
      draft: claim(OAUTH_URL, "Approval takes exactly one hour."),
      kind: "estimate",
    };
    const { claims, outcomes } = run([slot]);
    expect(claims[0]?.sources).toEqual([]);
    expect(outcomes[0]?.downgrade).toBe("quote_not_found");
  });

  it("downgrades a fact that takes part in a confirmed conflict, keeping its verified source", () => {
    const draft = claim(OAUTH_URL, QUOTES.cap);
    const { claims, outcomes } = run(
      [fact("limits.0", draft)],
      new Set([conflictKey(OAUTH_URL, QUOTES.cap)]),
    );
    expect(claims[0]).toMatchObject({ label: "uncertain" });
    expect(claims[0]?.sources).toHaveLength(1);
    expect(outcomes[0]?.downgrade).toBe("sources_disagree");
  });

  it("reports a missing quote ahead of a conflict", () => {
    const draft = claim(
      OAUTH_URL,
      "A sentence that is not on the page at all.",
    );
    const { outcomes } = run(
      [fact("limits.0", draft)],
      new Set([conflictKey(draft.url, draft.quote)]),
    );
    expect(outcomes[0]?.downgrade).toBe("quote_not_found");
  });

  it("never produces Tested: that label comes only from the probe", () => {
    const { claims } = run(claimSlots(DRAFTS));
    expect(claims.some((c) => c.label === "tested")).toBe(false);
  });

  it("gives every claim in a full set of drafts a valid claim, in slot order", () => {
    const slots = claimSlots(DRAFTS);
    const { claims, outcomes, checks } = run(slots);
    expect(claims.map((c) => c.id)).toEqual(slots.map((s) => s.id));
    expect(claims.every((c) => ClaimSchema.safeParse(c).success)).toBe(true);
    expect(outcomes).toHaveLength(slots.length);
    expect(checks.map((c) => c.claimId)).toEqual(slots.map((s) => s.id));
  });

  it("labels the full set: facts Sourced, the milestone estimates Uncertain", () => {
    const byId = Object.fromEntries(
      run(claimSlots(DRAFTS)).claims.map((c) => [c.id, c.label]),
    );
    expect(byId).toMatchObject({
      "verdict.summary": "sourced",
      "steps.0.detail": "sourced",
      "scopes.0.reason": "sourced",
      "limits.0": "sourced",
      "milestones.firstTest.effort": "uncertain",
      "milestones.production.wait": "uncertain",
    });
  });

  it("records one quote check per claim, with the content hash of the page it read", () => {
    const { checks } = run([
      fact("a.0"),
      fact("a.1", claim(OAUTH_URL, "Not on the page anywhere, honestly.")),
    ]);
    expect(checks.map((c) => c.result)).toEqual(["pass", "fail"]);
    expect(checks[0]?.detail.contentHash).toBe(PAGES[0]?.contentHash);
  });

  it("returns nothing for no slots", () => {
    expect(run([])).toEqual({ claims: [], outcomes: [], checks: [] });
  });
});
