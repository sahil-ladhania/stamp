/**
 * File: golden-recall.test.ts
 * Purpose: Tests counting how many golden pages the search found and the run read, with URL normalising and the old-host aliases.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { loadGolden, type Golden } from "../lib/golden.js";
import { goldenPageUrls, pageKey, scoreGoldenRecall } from "./golden-recall.js";

const all = await loadGolden();
const golden = (slug: string): Golden => {
  const found = all.find((g) => g.slug === slug);
  if (!found) throw new Error(`no golden ${slug}`);
  return found;
};

describe("pageKey", () => {
  it("ignores the scheme, www, query, fragment, trailing slash and case", () => {
    expect(pageKey("https://WWW.Example.com/Docs/Page/?hl=en#top")).toBe(
      "example.com/docs/page",
    );
  });

  it("keeps the host alone for a root URL", () => {
    expect(pageKey("https://example.com/")).toBe("example.com");
  });

  it("returns the text unchanged when it is not a URL", () => {
    expect(pageKey("not a url")).toBe("not a url");
  });
});

describe("goldenPageUrls", () => {
  it("lists each distinct page the tuning golden files cite", () => {
    const counts = Object.fromEntries(
      ["github", "gmail", "hubspot", "microsoft", "notion", "slack"].map(
        (slug) => [slug, goldenPageUrls(golden(slug)).length],
      ),
    );
    expect(counts).toEqual({
      github: 5,
      gmail: 6,
      hubspot: 7,
      microsoft: 7,
      notion: 2,
      slack: 5,
    });
  });
});

describe("scoreGoldenRecall", () => {
  const gmail = golden("gmail");
  const SCOPES =
    "https://developers.google.com/workspace/gmail/api/auth/scopes";
  const RESTRICTED =
    "https://developers.google.com/identity/protocols/oauth2/production-readiness/restricted-scope-verification";

  it("counts golden pages found in the results and read", () => {
    const result = scoreGoldenRecall(
      [`${SCOPES}?hl=en`, RESTRICTED, "https://example.com/other"],
      [SCOPES],
      gmail,
    );
    expect(result).toEqual({ total: 6, inResults: 2, fetched: 1 });
  });

  it("counts a read page as found even if it is missing from the results list", () => {
    expect(scoreGoldenRecall([], [SCOPES], gmail)).toEqual({
      total: 6,
      inResults: 1,
      fetched: 1,
    });
  });

  it("counts nothing for pages that are not golden", () => {
    expect(
      scoreGoldenRecall(
        ["https://example.com/a"],
        ["https://example.com/a"],
        gmail,
      ),
    ).toEqual({ total: 6, inResults: 0, fetched: 0 });
  });

  it("counts a page seen under Slack's old host as the golden page it redirects to", () => {
    const result = scoreGoldenRecall(
      [
        "https://api.slack.com/slack-marketplace/review-guide",
        "https://api.slack.com/authentication/oauth-v2",
      ],
      [],
      golden("slack"),
    );
    expect(result).toEqual({ total: 5, inResults: 2, fetched: 0 });
  });
});
