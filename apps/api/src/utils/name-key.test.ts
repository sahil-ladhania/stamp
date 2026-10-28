/**
 * File: name-key.test.ts
 * Purpose: Tests that nameKey makes names comparable regardless of case, spacing, punctuation and accents.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { nameKey } from "./name-key.js";

describe("nameKey", () => {
  it.each([
    ["HubSpot", "hubspot"],
    ["Hub Spot", "hubspot"],
    ["hub-spot.com", "hubspotcom"],
    ["Google Calendar API", "googlecalendarapi"],
    ["Cr\u00E8me Br\u00FBl\u00E9e", "cremebrulee"],
    ["  Notion!  ", "notion"],
  ])("turns %j into %j", (text, key) => {
    expect(nameKey(text)).toBe(key);
  });

  it("is empty for text with no Latin letters or digits", () => {
    expect(nameKey("")).toBe("");
    expect(nameKey("!!! ---")).toBe("");
  });
});
