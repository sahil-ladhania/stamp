/**
 * File: check-guide.test.ts
 * Purpose: Tests the library check: a good guide passes, and each rule fails on its own breakage with the claim it names.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { checkLibraryGuide } from "./check-guide.js";
import {
  claim,
  libraryGuide,
  official,
  thirdParty,
} from "./fixtures/library-guide.js";

const rulesOf = (input: unknown, slug = "acme") =>
  checkLibraryGuide(input, slug).failures.map((f) => [f.rule, f.claimId]);

describe("checkLibraryGuide", () => {
  it("passes a full guide whose Sourced claims all stand on an official page", () => {
    const result = checkLibraryGuide(libraryGuide(), "acme");
    expect(result.failures).toEqual([]);
    expect(result.guide?.slug).toBe("acme");
  });

  it("reports what the owner should look at without failing the guide", () => {
    const result = checkLibraryGuide(
      libraryGuide({ archetype: "unknown", scopes: [] }),
      "acme",
    );
    expect(result.failures).toEqual([]);
    expect(result.notes).toEqual([
      expect.stringMatching(/^\d+ of \d+ claims are Uncertain/),
      "Not rated: the review gate is not verified",
      "no scopes listed",
    ]);
  });

  it("fails a document that is not a guide, with no guide to copy", () => {
    const result = checkLibraryGuide({ slug: "acme" }, "acme");
    expect(result.guide).toBeNull();
    expect(result.failures.length).toBeGreaterThan(0);
    expect(result.failures.every((f) => f.rule === "schema")).toBe(true);
  });

  it("fails a guide whose slug is not its file name", () => {
    expect(rulesOf(libraryGuide({ slug: "other" }))).toEqual([
      ["slug", undefined],
    ]);
  });

  it("fails a guide whose asOf is not a date", () => {
    expect(rulesOf(libraryGuide({ asOf: "last tuesday" }))).toEqual([
      ["asof", undefined],
    ]);
  });

  it("fails a partial guide", () => {
    expect(rulesOf(libraryGuide({ coverage: "partial" }))).toEqual([
      ["coverage", undefined],
    ]);
  });

  it("fails a Sourced claim that stands only on a non-official page, and names it", () => {
    const guide = libraryGuide({
      requirements: [claim("requirements.0", "sourced", [thirdParty])],
    });
    expect(rulesOf(guide)).toEqual([["official_source", "requirements.0"]]);
  });

  it("fails a Tested claim on a forum page the same way", () => {
    const forum = { ...thirdParty, tier: "forum" as const };
    const guide = libraryGuide({
      requirements: [claim("requirements.0", "tested", [forum])],
    });
    expect(rulesOf(guide)).toEqual([["official_source", "requirements.0"]]);
  });

  it("keeps a Sourced claim that has one official page beside a third-party one", () => {
    const guide = libraryGuide({
      requirements: [
        claim("requirements.0", "sourced", [thirdParty, official]),
      ],
    });
    expect(rulesOf(guide)).toEqual([]);
  });

  it("keeps an Uncertain claim that cites a third-party page, since it claims nothing", () => {
    const guide = libraryGuide({
      requirements: [claim("requirements.0", "uncertain", [thirdParty])],
    });
    expect(rulesOf(guide)).toEqual([]);
  });

  it.each(["/.default", "your_scope", "user:", "mail.google.com"])(
    "fails the scope name %s",
    (name) => {
      const guide = libraryGuide({
        scopes: [{ id: "scopes.0", name, reason: claim("scopes.0.reason") }],
      });
      expect(rulesOf(guide)).toEqual([["scope_name", "scopes.0"]]);
    },
  );

  it("passes a scope when any page it cites fits the rules, and fails one cited only from an admin page", () => {
    const admin = { ...official, url: "https://docs.example.com/admin/scopes" };
    const scope = (sources: (typeof official)[]) =>
      libraryGuide({
        scopes: [
          {
            id: "scopes.0",
            name: "chat:write",
            reason: claim("scopes.0.reason", "sourced", sources),
          },
        ],
      });
    expect(rulesOf(scope([admin, official]))).toEqual([]);
    expect(rulesOf(scope([admin]))).toEqual([["scope_name", "scopes.0"]]);
  });

  it("fails a source that is not https", () => {
    const insecure = { ...official, url: "http://docs.example.com/oauth" };
    const guide = libraryGuide({
      requirements: [claim("requirements.0", "sourced", [insecure])],
    });
    expect(rulesOf(guide)).toEqual([["https", "requirements.0"]]);
  });

  it("reports every breakage, not just the first", () => {
    const guide = libraryGuide({
      coverage: "partial",
      requirements: [claim("requirements.0", "sourced", [thirdParty])],
    });
    expect(rulesOf(guide).map(([rule]) => rule)).toEqual([
      "coverage",
      "official_source",
    ]);
  });
});
