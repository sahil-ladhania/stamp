/**
 * File: trust-checks.test.ts
 * Purpose: Tests the deterministic checks on a matched quote: a legacy page, a scope or numbers the quote does not contain, and scope names that only a third party gives.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { trustCheck, type TrustInput } from "./trust-checks.js";

const base: TrustInput = {
  id: "steps.0.detail",
  claimText: "Create an app in the developer portal.",
  quote: "Create an app in the developer portal, then copy the client ID.",
  url: "https://docs.acme.com/guides/auth",
  title: "Create an OAuth app",
  tier: "official",
};
const check = (over: Partial<TrustInput>) => trustCheck({ ...base, ...over });

describe("trustCheck", () => {
  it("passes a claim whose quote supports it on a current official page", () => {
    expect(check({})).toBeNull();
  });

  describe("a legacy page", () => {
    it.each([
      ["a legacy title", { title: "Legacy OAuth scopes" }],
      ["a deprecated title", { title: "OAuth (deprecated)" }],
      ["an archived title", { title: "Archived: OAuth app guide" }],
      ["a legacy path", { url: "https://docs.acme.com/legacy/auth" }],
    ])("is stale: %s", (_name, over) => {
      expect(check(over)).toBe("stale_source");
    });

    it("does not read a word that only contains the marker", () => {
      expect(check({ title: "Legacyfree OAuth guide for apps" })).toBeNull();
    });

    it("works without a title", () => {
      expect(check({ title: undefined })).toBeNull();
    });
  });

  describe("scope names from a third party", () => {
    const scope = {
      id: "scopes.0.reason",
      claimText: "The chat:write scope posts messages.",
      quote: "chat:write lets an app post messages",
    };

    it("are third_party_only, on a third-party or forum page", () => {
      expect(check({ ...scope, tier: "third_party" })).toBe("third_party_only");
      expect(check({ ...scope, tier: "forum" })).toBe("third_party_only");
    });

    it("pass on an official page, and other claims pass on a third-party page", () => {
      expect(check({ ...scope, tier: "official" })).toBeNull();
      expect(check({ tier: "third_party" })).toBeNull();
    });

    it("do not match another section whose id starts the same", () => {
      expect(
        check({ ...scope, id: "scopesy.0", tier: "third_party" }),
      ).toBeNull();
    });
  });

  describe("figures and scope names the quote does not contain", () => {
    it("is not_supported when a number in the claim is not in the quote", () => {
      expect(
        check({
          claimText: "Review takes 30 days.",
          quote: "Review takes a few weeks.",
        }),
      ).toBe("not_supported");
    });

    it("passes when the number is there, in any spacing or thousands form", () => {
      expect(
        check({
          claimText: "Up to 1,000 installs.",
          quote: "Apps can have up to 1000 installs",
        }),
      ).toBeNull();
      expect(
        check({
          claimText: "Review takes 30 days.",
          quote: "Review takes up to 30 days.",
        }),
      ).toBeNull();
    });

    it("ignores a single digit, which is usually a count word or a step number", () => {
      expect(
        check({
          claimText: "Step 2 is to register.",
          quote: "Register the app.",
        }),
      ).toBeNull();
    });

    it("is not_supported when a scope name in the claim is not in the quote", () => {
      expect(
        check({
          claimText: "Use chat:write and users:read.",
          quote: "The chat:write scope posts messages.",
        }),
      ).toBe("not_supported");
      expect(
        check({
          claimText: "Request User.Read.All.",
          quote: "Request User.Read to sign in.",
        }),
      ).toBe("not_supported");
    });

    it("passes when every scope name is in the quote, whatever the case", () => {
      expect(
        check({ claimText: "Use Chat:Write.", quote: "the chat:write scope" }),
      ).toBeNull();
    });

    it("does not treat a URL or an abbreviation as a scope", () => {
      expect(
        check({
          claimText: "See https://docs.acme.com/x, e.g. the guide.",
          quote: "A guide.",
        }),
      ).toBeNull();
    });
  });

  it("reports the stale page before an unsupported claim", () => {
    expect(
      check({
        title: "Legacy docs",
        claimText: "Takes 30 days.",
        quote: "Takes a while.",
      }),
    ).toBe("stale_source");
  });
});
