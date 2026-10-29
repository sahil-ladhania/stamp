/**
 * File: golden.test.ts
 * Purpose: Tests that the ten golden files parse, follow the two-accepted-values rule and are consistent, and that the set selector works.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { GoldenSchema, loadGolden, selectGolden } from "./golden.js";

const all = await loadGolden();

describe("golden files", () => {
  it("holds six tuning apps and four holdout apps", () => {
    expect(selectGolden(all, "tuning").map((g) => g.slug)).toEqual([
      "github",
      "gmail",
      "hubspot",
      "microsoft",
      "notion",
      "slack",
    ]);
    expect(selectGolden(all, "holdout").map((g) => g.slug)).toEqual([
      "asana",
      "calendly",
      "dropbox",
      "zoom",
    ]);
  });

  it("names each file after its slug and keeps slugs unique", () => {
    expect(new Set(all.map((g) => g.slug)).size).toBe(all.length);
  });

  it("accepts at most two gates per app: the primary and one alternate", () => {
    for (const g of all) {
      expect(1 + g.reviewGate.alsoAccept.length, g.slug).toBeLessThanOrEqual(2);
      expect(g.reviewGate.alsoAccept, g.slug).not.toContain(g.reviewGate.value);
    }
  });

  it("accepts at most two waits per app: the primary and one alternate", () => {
    for (const g of all) {
      expect(
        1 + (g.approvalWait.alsoValid?.length ?? 0),
        g.slug,
      ).toBeLessThanOrEqual(2);
    }
  });

  it("gives every real scope a name that matches its own pattern, and no known fake does", () => {
    for (const g of all) {
      const pattern = new RegExp(
        g.scopes.namePattern,
        g.scopes.namePatternFlags,
      );
      for (const scope of g.scopes.real) {
        expect(pattern.test(scope.name), `${g.slug} ${scope.name}`).toBe(true);
      }
      for (const fake of g.scopes.knownFake) {
        expect(pattern.test(fake), `${g.slug} ${fake}`).toBe(false);
      }
    }
  });

  it("only cites https sources", () => {
    const urls = JSON.stringify(all).match(/"url":\s*"[^"]+"/g) ?? [];
    expect(urls.length).toBeGreaterThan(100);
    for (const entry of urls) {
      expect(entry).toMatch(/"https:\/\//);
    }
  });
});

describe("GoldenSchema", () => {
  it("rejects a golden with three accepted gates", () => {
    const bad = {
      ...structuredClone(all[0]),
      reviewGate: {
        ...all[0]?.reviewGate,
        alsoAccept: ["none", "optional_listing"],
      },
    };
    expect(GoldenSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects a range wait whose minimum is above its maximum", () => {
    const first = structuredClone(all[0]);
    const bad = {
      ...first,
      approvalWait: {
        ...first?.approvalWait,
        kind: "range",
        minDays: 9,
        maxDays: 2,
      },
    };
    expect(GoldenSchema.safeParse(bad).success).toBe(false);
  });
});

describe("selectGolden", () => {
  it("picks one app by slug", () => {
    expect(selectGolden(all, "gmail").map((g) => g.slug)).toEqual(["gmail"]);
  });

  it("names the choices when the selector is unknown", () => {
    expect(() => selectGolden(all, "nope")).toThrow(
      /Use tuning, holdout or one of: .*gmail/,
    );
  });
});
