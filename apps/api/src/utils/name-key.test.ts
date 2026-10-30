/**
 * File: name-key.test.ts
 * Purpose: Tests that nameKey makes names comparable regardless of case, spacing, punctuation and accents.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { nameKey, textKey } from "./name-key.js";

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

describe("textKey", () => {
  it("keeps letters and digits of any script and drops the rest", () => {
    expect(textKey("钉钉 开放平台!")).toBe("钉钉开放平台");
    expect(textKey("Cr\u00E8me Br\u00FBl\u00E9e 2")).toBe("cremebrulee2");
  });

  it("is the same as nameKey for Latin text, and nameKey stays Latin-only", () => {
    expect(textKey("Google Calendar API")).toBe(nameKey("Google Calendar API"));
    expect(nameKey("钉钉")).toBe("");
  });
});
