/**
 * File: passages-structure.test.ts
 * Purpose: Tests how selected excerpts are shaped: headings kept with their passage, touching passages joined, order and verbatim text.
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

describe("selectExcerpts structure", () => {
  const KEYWORDS = ["oauth", "scope"];

  it("keeps a heading with the passage under it, joined into one passage", () => {
    const text =
      "Intro text\n\n## Creating an app\n\nRegister your app and copy the oauth client";
    const { excerpts } = selectExcerpts([page(text)], ["oauth"], 5_000);
    expect(excerpts[0]?.passages).toEqual([
      "## Creating an app\n\nRegister your app and copy the oauth client",
    ]);
  });

  it("does not treat a short plain sentence as a heading", () => {
    const { excerpts } = selectExcerpts(
      [page("Our office is in Paris\n\nUse the oauth flow")],
      ["oauth"],
      5_000,
    );
    expect(excerpts[0]?.passages).toEqual(["Use the oauth flow"]);
  });

  it("keeps a Title Case line as a heading", () => {
    const { excerpts } = selectExcerpts(
      [page("Creating Your App\n\nUse the oauth flow")],
      ["oauth"],
      5_000,
    );
    expect(excerpts[0]?.passages).toEqual([
      "Creating Your App\n\nUse the oauth flow",
    ]);
  });

  it("does not keep a heading whose next passage is not relevant", () => {
    const { excerpts } = selectExcerpts(
      [page("## Pricing\n\nCosts money\n\noauth is here")],
      ["oauth"],
      5_000,
    );
    expect(excerpts.flatMap((e) => e.passages)).toEqual(["oauth is here"]);
  });

  it("joins passages that touch and keeps the text between them", () => {
    const { excerpts } = selectExcerpts(
      [page("oauth one\n\noauth two\n\nunrelated text\n\noauth three")],
      ["oauth"],
      5_000,
    );
    expect(excerpts[0]?.passages).toEqual([
      "oauth one\n\noauth two",
      "oauth three",
    ]);
  });

  it("does not join passages separated by a long gap, so the budget cannot be overrun by whitespace", () => {
    const { excerpts } = selectExcerpts(
      [page(`oauth one${"\n".repeat(30)}oauth two`)],
      ["oauth"],
      5_000,
    );
    expect(excerpts[0]?.passages).toEqual(["oauth one", "oauth two"]);
  });

  it("returns pages in the order given and passages in page order", () => {
    const a = page(
      "later oauth\n\nfiller\n\nearlier oauth scope",
      "official",
      "https://docs.acme.com/a",
    );
    const b = page("oauth b", "third_party", "https://blog.example.net/b");
    const { excerpts } = selectExcerpts([a, b], KEYWORDS, 5_000);
    expect(excerpts.map((e) => e.url)).toEqual([
      "https://docs.acme.com/a",
      "https://blog.example.net/b",
    ]);
    expect(excerpts[0]?.passages).toEqual([
      "later oauth",
      "earlier oauth scope",
    ]);
  });

  it("keeps quotable text word for word, including markdown and unicode", () => {
    const quote =
      "Apps with **more than 25 installs** need \u201Creview\u201D first (oauth).";
    const { excerpts } = selectExcerpts(
      [page(`Other\n\n${quote}`)],
      ["oauth"],
      5_000,
    );
    expect(excerpts[0]?.passages.join("")).toContain(quote);
  });

  it("reports the characters it selected", () => {
    const { excerpts, chars } = selectExcerpts(
      [page("oauth abc\n\nplain\n\noauth de")],
      ["oauth"],
      5_000,
    );
    expect(chars).toBe(excerpts.flatMap((e) => e.passages).join("").length);
  });
});
