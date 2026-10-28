/**
 * File: typed-input.test.ts
 * Purpose: Tests reading typed input: domains and URLs versus app names, name cleaning and display casing.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import {
  MAX_NAME_LENGTH,
  cleanName,
  displayName,
  parseTyped,
} from "./typed-input.js";

describe("cleanName", () => {
  it("collapses whitespace, tabs and newlines into single spaces", () => {
    expect(cleanName("  Google \t Calendar\n API ")).toBe(
      "Google Calendar API",
    );
  });

  it("replaces control characters with spaces", () => {
    expect(cleanName(`Hub${String.fromCharCode(0)}Spot`)).toBe("Hub Spot");
  });

  it("cuts a long name to 100 characters with no trailing space", () => {
    const cleaned = cleanName(`${"a".repeat(99)} ${"b".repeat(50)}`);
    expect(cleaned.length).toBeLessThanOrEqual(MAX_NAME_LENGTH);
    expect(cleaned.endsWith(" ")).toBe(false);
  });

  it("is empty for blank input", () => {
    expect(cleanName(" \n\t ")).toBe("");
  });
});

describe("displayName", () => {
  it("capitalises each word of a name typed in lower case", () => {
    expect(displayName("google calendar")).toBe("Google Calendar");
  });

  it("keeps a name that has any capital letter as typed", () => {
    expect(displayName("HubSpot")).toBe("HubSpot");
    expect(displayName("IBM")).toBe("IBM");
    expect(displayName("iPhone")).toBe("iPhone");
  });

  it("leaves letters without case alone", () => {
    const word = String.fromCodePoint(0x65e5, 0x672c);
    expect(displayName(word)).toBe(word);
  });
});

describe("parseTyped", () => {
  it("takes the registrable domain from a URL and names the app after its brand", () => {
    expect(
      parseTyped("https://developers.notion.com/docs/authorization"),
    ).toEqual({
      kind: "domain",
      domain: "notion.com",
      name: "Notion",
    });
  });

  it.each([
    ["hubspot.com", "hubspot.com", "Hubspot"],
    ["www.hubspot.com/", "hubspot.com", "Hubspot"],
    ["HTTP://Docs.Slack.COM?x=1", "slack.com", "Slack"],
    ["docs.bbc.co.uk", "bbc.co.uk", "Bbc"],
  ])("reads the domain %s", (typed, domain, name) => {
    expect(parseTyped(typed)).toEqual({ kind: "domain", domain, name });
  });

  it("treats a plain name as a name to look up, cleaned and capitalised", () => {
    expect(parseTyped("  google   calendar ")).toEqual({
      kind: "name",
      name: "Google Calendar",
    });
    expect(parseTyped("HubSpot")).toEqual({ kind: "name", name: "HubSpot" });
  });

  it.each([
    "http://127.0.0.1:3000",
    "localhost",
    "http://localhost:5173/app",
    "http://[::1]/",
  ])("does not take %s as an official domain", (typed) => {
    expect(parseTyped(typed).kind).toBe("name");
  });

  it("gives an empty name for blank input", () => {
    expect(parseTyped("   ")).toEqual({ kind: "name", name: "" });
  });
});
