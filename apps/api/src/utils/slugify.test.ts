/**
 * File: slugify.test.ts
 * Purpose: Tests slug creation from app names and URLs.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { slugify } from "./slugify.js";

describe("slugify", () => {
  it("lowercases a plain app name", () => {
    expect(slugify("HubSpot")).toBe("hubspot");
  });

  it("joins words with hyphens and trims punctuation", () => {
    expect(slugify("  Google   Calendar! ")).toBe("google-calendar");
  });

  it("strips diacritics", () => {
    expect(slugify("Café")).toBe("cafe");
  });

  it("takes the app label from a URL, ignoring www, subdomains and paths", () => {
    expect(slugify("https://www.notion.so/product")).toBe("notion");
    expect(slugify("https://developers.hubspot.com/docs")).toBe("hubspot");
    expect(slugify("docs.github.com")).toBe("github");
  });

  it("treats a bare domain like a URL", () => {
    expect(slugify("HubSpot.com")).toBe("hubspot");
  });

  it("handles two-part suffixes", () => {
    expect(slugify("https://www.bbc.co.uk")).toBe("bbc");
  });

  it("returns an empty slug when nothing usable remains", () => {
    expect(slugify("!!!")).toBe("");
    expect(slugify("   ")).toBe("");
  });

  it("never exceeds 100 characters", () => {
    expect(slugify("a".repeat(150)).length).toBe(100);
  });
});
