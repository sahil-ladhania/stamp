/**
 * File: duration.test.ts
 * Purpose: Tests the duration-shape check for milestone effort and wait text.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { durationShape } from "./duration.js";

describe("durationShape", () => {
  it.each([
    "3 to 7 days",
    "5-10 business days",
    "2 weeks",
    "about 2 weeks",
    "up to 10 days",
    "10 minutes",
    "1.5 hours",
    "Less than 1 day",
    "3 – 5 working days",
    "6 weeks.",
  ])("treats %j as a duration", (text) => {
    expect(durationShape(text)).toBe("duration");
  });

  it.each(["no wait", "None", "Instant", "same day"])(
    "treats the plain answer %j as a duration",
    (text) => {
      expect(durationShape(text)).toBe("duration");
    },
  );

  it.each([
    "Not found in the fetched sources.",
    "Not researched before the time budget ran out.",
    "Could not be read reliably from the fetched sources.",
  ])("treats the agent's unknown text %j as unknown", (text) => {
    expect(durationShape(text)).toBe("unknown");
  });

  it.each([
    "Use the Quickstart to create a token and call the API",
    "It takes about 10 minutes to register the app and copy the keys",
    "Several weeks, depending on the review",
    "It takes 3 days",
    "Usually 3 to 7 days",
    "Review: 5 business days",
    "7 days of testing, then a review",
    "",
    "days",
  ])("treats %j as prose", (text) => {
    expect(durationShape(text)).toBe("prose");
  });
});
