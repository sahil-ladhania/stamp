/**
 * File: duration-text.test.ts
 * Purpose: Tests reading a time out of a quote and writing it in the one form the guide shows ("3 to 7 business days"), or nothing when the quote states none.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { durationFromQuote } from "./duration-text.js";

describe("durationFromQuote", () => {
  it.each([
    ["Review usually takes 5 to 7 business days.", "5 to 7 business days"],
    ["It can take 2-3 weeks to hear back.", "2 to 3 weeks"],
    ["Approval takes about 10 days.", "about 10 days"],
    ["Responses arrive in 4–6 weeks.", "4 to 6 weeks"],
    ["We review apps within 3 working days.", "up to 3 working days"],
    ["Allow up to 6 weeks for the review.", "up to 6 weeks"],
    ["Verification takes at least 2 weeks.", "at least 2 weeks"],
    ["The review is usually under 48 hours.", "under 48 hours"],
    ["Takes two weeks.", "2 weeks"],
    ["Expect three to five days.", "3 to 5 days"],
    ["Reviews take between 3 and 5 business days.", "3 to 5 business days"],
    ["Your app is live in 1 day.", "1 day"],
    ["Setup takes 15 minutes.", "15 minutes"],
    ["Reviews take 1 to 2 months.", "1 to 2 months"],
    ["It takes 5 or 6 days.", "5 to 6 days"],
  ])("writes %j as %j", (quote, expected) => {
    expect(durationFromQuote(quote)).toBe(expected);
  });

  it("uses the first time in the quote", () => {
    expect(
      durationFromQuote(
        "Review takes 5 to 7 days; apps idle for 30 days are removed.",
      ),
    ).toBe("5 to 7 days");
  });

  it("writes the unit in the singular for exactly one", () => {
    expect(durationFromQuote("Takes 1 week.")).toBe("1 week");
    expect(durationFromQuote("Takes one hour.")).toBe("1 hour");
  });

  it.each([
    "Create an app in the developer portal and copy the client ID.",
    "Review takes a while.",
    "There are 25 installs allowed before approval.",
    "Updated 3 times a year.",
    "",
  ])("is null when the quote states no time: %j", (quote) => {
    expect(durationFromQuote(quote)).toBeNull();
  });

  it("does not take a number that is part of a larger word or another unit", () => {
    expect(durationFromQuote("Use the 30daysfree plan.")).toBeNull();
    expect(durationFromQuote("Up to 100 requests per 10 seconds.")).toBeNull();
    expect(durationFromQuote("Rate limit is 5 per day.")).toBeNull();
  });
});
