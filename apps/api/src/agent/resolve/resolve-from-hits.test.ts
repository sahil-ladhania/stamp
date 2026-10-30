/**
 * File: resolve-from-hits.test.ts
 * Purpose: Tests the shared Resolve decision: official with an identity, ambiguous or none without one.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { agreedDocsSite, resolveFromHits } from "./resolve-from-hits.js";

const hit = (url: string, title: string) => ({ url, title });

describe("resolveFromHits", () => {
  it("decides official and derives the identity from the same hits", () => {
    const result = resolveFromHits("Acme", [
      hit("https://developers.acme.com/docs/oauth", "OAuth | Acme API"),
      hit("https://developers.acme.com/docs/scopes", "Scopes | Acme API"),
    ]);
    expect(result.decision).toEqual({ kind: "official", domain: "acme.com" });
    expect(result.identity?.domains).toEqual(["acme.com"]);
    expect(result.candidates[0]?.match).toBe("exact");
  });

  it("decides none, with no identity, when nothing matches the name", () => {
    const result = resolveFromHits("Acme", [
      hit("https://example.org/a", "Something else"),
    ]);
    expect(result.decision).toEqual({ kind: "none" });
    expect(result.identity).toBeNull();
  });

  it("decides none for no hits at all", () => {
    expect(resolveFromHits("Acme", []).decision).toEqual({ kind: "none" });
  });
});

describe("resolveFromHits when nothing matches the name but the hits agree on one documentation site", () => {
  const docs = [
    hit("https://developer.x.com/", "X Developer Platform"),
    hit("https://docs.x.com/overview", "X Developer Platform - X"),
  ];

  it("asks about that one site instead of ending, and never picks it", () => {
    const result = resolveFromHits("Twitter", docs);
    expect(result.decision).toEqual({
      kind: "ambiguous",
      options: [{ name: "X", domain: "x.com" }],
    });
    expect(result.identity).toBeNull();
  });

  it.each([
    ["one hit", [docs[0] as { url: string; title: string }]],
    [
      "a hit that is not documentation",
      [...docs, hit("https://x.com/someone/status/1", "A post")],
    ],
    [
      "two sites",
      [
        docs[0] as { url: string; title: string },
        hit("https://docs.other.com/a", "Other"),
      ],
    ],
    [
      "a shared host",
      [
        hit("https://a.readme.io/docs/x", "A"),
        hit("https://b.readme.io/docs/y", "B"),
      ],
    ],
    ["no hits", []],
  ])("still ends with nothing for %s", (_label, hits) => {
    expect(resolveFromHits("Twitter", hits).decision).toEqual({ kind: "none" });
  });

  it("does not ask when a candidate matches the name", () => {
    const named = [
      hit("https://developers.acme.com/docs/a", "Acme"),
      hit("https://developers.acme.com/docs/b", "Acme"),
    ];
    expect(resolveFromHits("Acme", named).decision.kind).toBe("official");
  });
});

describe("agreedDocsSite", () => {
  it("names the site by its brand label", () => {
    expect(
      agreedDocsSite([
        hit("https://docs.dingtalk.com/a", ""),
        hit("https://open.dingtalk.com/api/b", ""),
      ]),
    ).toEqual({
      name: "Dingtalk",
      domain: "dingtalk.com",
    });
  });
});
