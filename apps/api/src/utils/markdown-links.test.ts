/**
 * File: markdown-links.test.ts
 * Purpose: Tests rewriting markdown links so the visible text keeps its address, which is what makes a scope name in a link cell readable to the quote check.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { rewriteLinks } from "./markdown-links.js";

describe("rewriteLinks", () => {
  it.each([
    [
      "| [https://www.googleapis.com/auth/gmail.labels](https://www.googleapis.com/auth/gmail.labels) | See and edit labels. |",
      "| https://www.googleapis.com/auth/gmail.labels | See and edit labels. |",
    ],
    [
      "See [the scopes page](https://docs.acme.com/scopes).",
      "See the scopes page (https://docs.acme.com/scopes).",
    ],
    [
      "[chat:write](/reference/scopes/chat.write)",
      "chat:write (/reference/scopes/chat.write)",
    ],
    ['[label](https://a.com/x "A title")', "label (https://a.com/x)"],
    ["[label](<https://a.com/x>)", "label (https://a.com/x)"],
    [
      "[a](https://a.com/1) and [b](https://a.com/2)",
      "a (https://a.com/1) and b (https://a.com/2)",
    ],
  ])("rewrites %j", (input, expected) => {
    expect(rewriteLinks(input)).toBe(expected);
  });

  it("drops an image and keeps the rest of the line", () => {
    expect(rewriteLinks("Logo ![Acme logo](https://a.com/logo.png) here")).toBe(
      "Logo  here",
    );
  });

  it("leaves text without links, other markdown and brackets that are not links alone", () => {
    const text = "# Title\n\n**bold** `code` [not a link] (nor this) and [a]b";
    expect(rewriteLinks(text)).toBe(text);
  });

  it("does not change an empty label's link into an empty string", () => {
    expect(rewriteLinks("[](https://a.com/x)")).toBe("https://a.com/x");
  });

  it("is safe on a very long line with many brackets", () => {
    const line = "[".repeat(5_000) + "](x)";
    expect(rewriteLinks(line).length).toBeGreaterThan(0);
  });
});
