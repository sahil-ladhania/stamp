/**
 * File: passages-select.test.ts
 * Purpose: Tests excerpt selection: relevance, the character budget, official-first ranking and the per-page cap.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { selectExcerpts, type PageText } from "./passages.js";

const page = (
  text: string,
  tier: PageText["tier"] = "official",
  url = "https://docs.acme.com/p",
): PageText => ({ url, tier, text });

describe("selectExcerpts relevance and budget", () => {
  const KEYWORDS = ["oauth", "scope"];

  it("keeps only passages that mention a keyword, each an exact slice of the page", () => {
    const text =
      "Welcome to the docs\n\nOAuth scopes control access to data\n\nOur office is in Paris\n\nUse the oauth flow";
    const { excerpts } = selectExcerpts([page(text)], KEYWORDS, 5_000);
    const passages = excerpts.flatMap((e) => e.passages);
    expect(passages.join("\n")).toContain(
      "OAuth scopes control access to data",
    );
    expect(passages.join("\n")).toContain("Use the oauth flow");
    expect(passages.join("\n")).not.toContain("Paris");
    for (const passage of passages) {
      expect(text).toContain(passage);
    }
  });

  it("returns nothing when no passage mentions a keyword", () => {
    expect(selectExcerpts([page("Hello\n\nWorld")], KEYWORDS, 5_000)).toEqual({
      excerpts: [],
      chars: 0,
    });
    expect(selectExcerpts([], KEYWORDS, 5_000)).toEqual({
      excerpts: [],
      chars: 0,
    });
  });

  it("never returns more than the character budget", () => {
    const text = Array.from(
      { length: 40 },
      (_, i) => `OAuth passage ${i} ${"x".repeat(80)}`,
    ).join("\n\n");
    const { chars } = selectExcerpts([page(text)], KEYWORDS, 1_000);
    expect(chars).toBeLessThanOrEqual(1_000);
    expect(chars).toBeGreaterThan(500);
  });

  it("skips a passage too big for the space left and still takes a smaller one", () => {
    const big = `oauth scope ${"y".repeat(400)}`;
    const small = "oauth short";
    const { excerpts } = selectExcerpts(
      [page(`${big}\n\n${small}`)],
      KEYWORDS,
      100,
    );
    expect(excerpts.flatMap((e) => e.passages)).toEqual([small]);
  });

  it("prefers official pages over third-party pages when the budget is tight", () => {
    const official = page(
      `oauth scope official ${"o".repeat(29)}`,
      "official",
      "https://docs.acme.com/a",
    );
    const blog = page(
      `oauth scope blog ${"b".repeat(33)}`,
      "third_party",
      "https://blog.example.net/b",
    );
    const { excerpts } = selectExcerpts([blog, official], KEYWORDS, 100);
    expect(excerpts.map((e) => e.url)).toEqual(["https://docs.acme.com/a"]);
  });

  it("stops one page from taking more than 60% of the budget when there are several pages", () => {
    const many = Array.from(
      { length: 30 },
      (_, i) => `oauth passage ${i} ${"z".repeat(50)}`,
    ).join("\n\n");
    const { excerpts } = selectExcerpts(
      [
        page(many, "official", "https://docs.acme.com/a"),
        page(
          "oauth scope other source passage",
          "third_party",
          "https://blog.example.net/b",
        ),
      ],
      KEYWORDS,
      1_000,
    );
    const firstChars = excerpts[0]!.passages.join("").length;
    expect(firstChars).toBeLessThanOrEqual(600);
    expect(excerpts.map((e) => e.url)).toContain("https://blog.example.net/b");
  });

  it("lets a single page use the whole budget", () => {
    const many = Array.from(
      { length: 30 },
      (_, i) => `oauth passage ${i} ${"z".repeat(50)}`,
    ).join("\n\n");
    const { chars } = selectExcerpts([page(many)], KEYWORDS, 1_000);
    expect(chars).toBeGreaterThan(900);
  });
});
