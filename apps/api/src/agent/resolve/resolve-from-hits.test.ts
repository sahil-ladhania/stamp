/**
 * File: resolve-from-hits.test.ts
 * Purpose: Tests the shared Resolve decision: official with an identity, ambiguous or none without one.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { resolveFromHits } from "./resolve-from-hits.js";

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
