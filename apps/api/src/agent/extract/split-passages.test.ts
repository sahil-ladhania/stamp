/**
 * File: split-passages.test.ts
 * Purpose: Tests splitting page text into passages: blank-line blocks, trimming, long-block cuts and verbatim text.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { MAX_PASSAGE_CHARS, splitPassages } from "./split-passages.js";

const slices = (text: string) =>
  splitPassages(text).map((s) => text.slice(s.start, s.end));
const sentence = (n: number) =>
  `Sentence number ${n} explains how the thing works. `;

describe("splitPassages", () => {
  it("splits on blank lines and trims each block, changing nothing else", () => {
    expect(
      slices("# Title\n\nFirst block\nsecond line\n\n\n  Third block  \n"),
    ).toEqual(["# Title", "First block\nsecond line", "Third block"]);
  });

  it("treats CRLF line breaks and whitespace-only lines as blank lines", () => {
    expect(slices("One\r\n\r\nTwo\r\n \t \r\nThree")).toEqual([
      "One",
      "Two",
      "Three",
    ]);
  });

  it("returns nothing for empty or whitespace-only text", () => {
    expect(splitPassages("")).toEqual([]);
    expect(splitPassages(" \n\n \t\n")).toEqual([]);
  });

  it("returns one passage for text with no blank line", () => {
    expect(slices("a\nb\nc")).toEqual(["a\nb\nc"]);
  });

  it("gives spans in order that never overlap", () => {
    const spans = splitPassages("A\n\nB\n\nC\n\n" + sentence(1).repeat(60));
    for (let i = 1; i < spans.length; i++) {
      expect(spans[i]!.start).toBeGreaterThanOrEqual(spans[i - 1]!.end);
    }
  });

  it("cuts a long block into pieces of at most 1,200 characters, at sentence ends", () => {
    const text = Array.from({ length: 60 }, (_, i) => sentence(i)).join("");
    const pieces = slices(text);
    expect(pieces.length).toBeGreaterThan(2);
    for (const piece of pieces) {
      expect(piece.length).toBeLessThanOrEqual(MAX_PASSAGE_CHARS);
      expect(piece.endsWith(".")).toBe(true);
      expect(text).toContain(piece);
    }
  });

  it("prefers to cut a long block at a line end", () => {
    const line = "x".repeat(300);
    const text = [line, line, line, line, line].join("\n");
    const pieces = slices(text);
    expect(pieces.every((p) => p.length <= MAX_PASSAGE_CHARS)).toBe(true);
    expect(pieces.every((p) => !p.startsWith("\n") && !p.endsWith("\n"))).toBe(
      true,
    );
    expect(pieces.join("\n")).toBe(text);
  });

  it("still makes progress on a long block with no break at all", () => {
    const pieces = slices("a".repeat(3000));
    expect(pieces.map((p) => p.length)).toEqual([1200, 1200, 600]);
  });

  it("keeps markdown, punctuation and unicode exactly as written", () => {
    const block =
      "**Bold** \u2014 \u201Cquoted\u201D `code` [link](https://x.y)";
    expect(slices(`${block}\n\nnext`)[0]).toBe(block);
  });
});
