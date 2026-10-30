/**
 * File: candidates-evidence.test.ts
 * Purpose: Tests what counts as evidence for a domain: a name in a title, an address or the start of a snippet, a title-only match needing a documentation page, an exact label without one losing to another brand's documentation, and a denied site's documentation page.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { rankCandidates, type ResolveHit } from "./candidates.js";

const hit = (url: string, title = ""): ResolveHit => ({ url, title });
const byDomain = (name: string, hits: ResolveHit[]) =>
  Object.fromEntries(rankCandidates(name, hits).map((c) => [c.domain, c]));

describe("a name found only in a page title", () => {
  it("counts when the domain has a documentation page", () => {
    const found = byDomain("Gmail", [
      hit(
        "https://developers.google.com/workspace/gmail/api",
        "Gmail API overview",
      ),
    ]);
    expect(found["google.com"]?.match).toBe("title");
  });

  it("does not count on a page that is not documentation, such as a directory entry", () => {
    const found = byDomain("QuickBooks", [
      hit(
        "https://apitracker.io/a/quickbooks",
        "QuickBooks API - Developer docs",
      ),
      hit("https://developer.intuit.com/app/docs/qbo", "QuickBooks Online API"),
    ]);
    expect(found["apitracker.io"]?.match).toBe("none");
    expect(found["intuit.com"]?.match).toBe("title");
    expect(
      rankCandidates("QuickBooks", [
        hit(
          "https://apitracker.io/a/quickbooks",
          "QuickBooks API - Developer docs",
        ),
      ])[0]?.match,
    ).toBe("none");
  });
});

describe("an exact label with no documentation page", () => {
  const video = hit(
    "https://www.youtube.com/watch?v=abc",
    "YouTube API Tutorial",
  );
  const docs = [
    hit(
      "https://developers.google.com/youtube/data",
      "YouTube Data API | Google for Developers",
    ),
    hit(
      "https://developers.google.com/youtube/documentation",
      "YouTube Developer Documentation",
    ),
  ];

  it("counts as a title match when another brand's documentation names the app", () => {
    const found = byDomain("YouTube", [...docs, video]);
    expect(found["youtube.com"]?.match).toBe("title");
    expect(rankCandidates("YouTube", [...docs, video])[0]?.domain).toBe(
      "google.com",
    );
  });

  it("keeps its full weight when it has a documentation page itself", () => {
    const found = byDomain("YouTube", [
      ...docs,
      hit("https://developers.youtube.com/docs", "YouTube"),
    ]);
    expect(found["youtube.com"]?.match).toBe("exact");
  });

  it("keeps its full weight when nothing else has documentation (a directory page is no rival)", () => {
    const found = byDomain("Slack", [
      hit(
        "https://www.skillsdirectory.com/skills/slackapi",
        "Slack Api - Skills Directory",
      ),
      hit("https://slack.dev/", "Developer Hub | Slack Developers"),
    ]);
    expect(found["slack.dev"]?.match).toBe("exact");
  });

  it("keeps its full weight against a domain whose label holds the name: that is a second brand, left to the question", () => {
    const found = byDomain("Mercury", [
      hit("https://docs.mercuryapp.io/x", "Mercury"),
      hit("https://mercury.com/", "Mercury"),
    ]);
    expect(found["mercury.com"]?.match).toBe("exact");
    expect(found["mercuryapp.io"]?.match).toBe("partial");
  });
});

describe("the app's name in an address or a snippet", () => {
  const instagram = hit(
    "https://developers.meta.example/documentation/instagram-platform/content-publishing",
    "Content Publishing | Meta for Developers",
  );

  it("counts when it is in the address, not the title", () => {
    expect(byDomain("Instagram", [instagram])["meta.example"]?.match).toBe(
      "title",
    );
  });

  it("counts when it is in the start of the snippet", () => {
    const found = byDomain("Instagram", [
      {
        url: "https://developers.acme.example/guide",
        title: "Guide",
        snippet: "This guide assumes you read the Instagram Platform Overview.",
      },
    ]);
    expect(found["acme.example"]?.match).toBe("title");
  });

  it("ignores the snippet past its first 200 characters", () => {
    const late = `${"x ".repeat(120)}Instagram`;
    const found = byDomain("Instagram", [
      {
        url: "https://developers.acme.example/guide",
        title: "Guide",
        snippet: late,
      },
    ]);
    expect(found["acme.example"]?.match).toBe("none");
  });

  it("finds a name in another script, which the Latin-only key could not compare", () => {
    const found = byDomain("钉钉", [
      {
        url: "https://open.dingtalk.example/document/api-list",
        title: "列出多行记录",
        snippet: "钉钉开放平台 应用中心",
      },
    ]);
    expect(found["dingtalk.example"]?.match).toBe("title");
  });

  it("does not match a one-letter Latin name on a page, but does a two-character name in Chinese", () => {
    expect(
      byDomain("X", [hit("https://docs.acme.example/x-guide", "X guide")])[
        "acme.example"
      ]?.match,
    ).toBe("none");
  });
});

describe("a documentation page on a denied site", () => {
  it("is kept when it names the app, so Instagram's docs on developers.facebook.com count", () => {
    const found = byDomain("Instagram", [
      hit(
        "https://developers.facebook.com/documentation/instagram-platform/overview",
        "Overview | Meta for Developers",
      ),
    ]);
    expect(found["facebook.com"]).toMatchObject({ match: "title", docs: true });
  });

  it("is kept for a name that only contains the denied brand (GitHub Actions)", () => {
    const found = byDomain("GitHub Actions", [
      hit("https://docs.github.com/en/actions", "GitHub Actions documentation"),
    ]);
    expect(found["github.com"]?.match).toBe("partial");
  });

  it("is dropped when it does not name the app", () => {
    expect(
      rankCandidates("Instagram", [
        hit("https://developers.facebook.com/docs/pages", "Pages API"),
      ]),
    ).toEqual([]);
  });

  it("is dropped when the page is not documentation, whatever it names", () => {
    expect(
      rankCandidates("Instagram", [
        hit("https://www.facebook.com/instagram/posts/1", "Instagram"),
      ]),
    ).toEqual([]);
    expect(
      rankCandidates("Instagram", [
        hit(
          "https://github.com/someone/instagram-api-documentation",
          "Instagram API",
        ),
      ]),
    ).toEqual([]);
  });
});
