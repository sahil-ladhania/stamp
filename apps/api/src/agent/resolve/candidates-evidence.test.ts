/**
 * File: candidates-evidence.test.ts
 * Purpose: Tests what counts as evidence for a domain: a title-only match needs a documentation page, and an exact label without one loses to another brand's documentation that names the app.
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
