/**
 * File: sources.test.ts
 * Purpose: Tests sorting cited source URLs into wrong-product, soft-product, off-hint, third-party and fine, using the golden hints.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { loadGolden, type Golden } from "../lib/golden.js";
import { matchesHint, onDocsPath, scoreSources } from "./sources.js";

const all = await loadGolden();
const golden = (slug: string): Golden => {
  const found = all.find((g) => g.slug === slug);
  if (!found) throw new Error(`no golden ${slug}`);
  return found;
};

describe("matchesHint", () => {
  it("matches host plus path, ignoring case", () => {
    expect(
      matchesHint(
        "https://Docs.Cloud.Google.com/contact-center/ccai-platform/docs/x",
        "docs.cloud.google.com/contact-center",
      ),
    ).toBe(true);
  });

  it("matches a bare path fragment anywhere in host and path", () => {
    expect(
      matchesHint(
        "https://developers.hubspot.com/docs/legacy-apps/private-apps/x",
        "private-apps",
      ),
    ).toBe(true);
  });

  it("does not match a different product on the same host", () => {
    expect(
      matchesHint(
        "https://developers.google.com/workspace/gmail/api/auth/scopes",
        "developers.google.com/workspace/add-ons",
      ),
    ).toBe(false);
  });

  it("returns false for a URL that does not parse", () => {
    expect(matchesHint("not a url", "x")).toBe(false);
  });
});

describe("onDocsPath", () => {
  it("accepts a page on an official domain under a path hint", () => {
    expect(
      onDocsPath(
        "https://developers.google.com/workspace/gmail/api/guides",
        golden("gmail").docs,
      ),
    ).toBe(true);
  });

  it("rejects an official-domain page outside the path hints", () => {
    expect(
      onDocsPath(
        "https://developers.google.com/maps/documentation",
        golden("gmail").docs,
      ),
    ).toBe(false);
  });

  it("matches subdomains of an official domain", () => {
    expect(
      onDocsPath(
        "https://www.dropbox.com/developers/reference/developer-guide",
        golden("dropbox").docs,
      ),
    ).toBe(true);
  });

  it("rejects a third-party host", () => {
    expect(
      onDocsPath(
        "https://www.cloudsponge.com/blog/gmail-oauth",
        golden("gmail").docs,
      ),
    ).toBe(false);
  });
});

describe("scoreSources", () => {
  const gmail = golden("gmail");

  it("flags the Contact Center AI page as wrong product", () => {
    const result = scoreSources(
      [
        "https://docs.cloud.google.com/contact-center/ccai-platform/docs/oauth-email-google",
      ],
      gmail,
    );
    expect(result.wrongProduct).toHaveLength(1);
    expect(result.ok).toEqual([]);
  });

  it("flags a soft sibling product separately from the hard list", () => {
    const result = scoreSources(
      ["https://docs.github.com/en/apps/creating-github-apps/x"],
      golden("github"),
    );
    expect(result.softProduct).toHaveLength(1);
    expect(result.wrongProduct).toEqual([]);
  });

  it("keeps good pages, off-path official pages and third-party pages apart", () => {
    const result = scoreSources(
      [
        "https://developers.google.com/workspace/gmail/api/auth/scopes",
        "https://developers.google.com/maps/documentation",
        "https://www.cloudsponge.com/blog/gmail-oauth",
      ],
      gmail,
    );
    expect(result.ok).toHaveLength(1);
    expect(result.offHint).toEqual([
      "https://developers.google.com/maps/documentation",
    ]);
    expect(result.thirdParty).toEqual([
      "https://www.cloudsponge.com/blog/gmail-oauth",
    ]);
  });

  it("counts a repeated URL once", () => {
    const url = "https://docs.cloud.google.com/contact-center/x";
    expect(scoreSources([url, url], gmail).wrongProduct).toEqual([url]);
  });
});
