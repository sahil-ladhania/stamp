/**
 * File: queries-search-name.test.ts
 * Purpose: Tests what the run's queries are about: the product phrase when there is one, else the app's name, and that model queries must keep it.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { acceptQuery, mergePlan, retryQueries, searchName } from "./queries.js";

describe("searchName", () => {
  it("is the product phrase when the run has one, so every query names the product", () => {
    expect(searchName({ appName: "Gmail", product: "Gmail API" })).toBe(
      "Gmail API",
    );
  });

  it("is the app name when there is no product phrase", () => {
    expect(searchName({ appName: "HubSpot", product: null })).toBe("HubSpot");
  });

  it("makes queries that need the phrase, so a model query that drops the product is replaced", () => {
    const name = searchName({ appName: "Gmail", product: "Gmail API" });
    expect(acceptQuery(name, "Gmail OAuth scopes reference")).toBeNull();
    expect(acceptQuery(name, "Gmail API OAuth scopes reference")).toBe(
      "Gmail API OAuth scopes reference",
    );
    const merged = mergePlan(name, {
      setup: "Gmail setup help please",
      scopes: "Gmail API OAuth scopes reference",
      review: null,
      limits: null,
      authType: null,
      approvalWait: null,
    });
    expect(merged.find((q) => q.topic === "setup")?.text).toBe(
      "Gmail API OAuth app setup client ID redirect URI",
    );
    expect(merged.find((q) => q.topic === "scopes")?.text).toBe(
      "Gmail API OAuth scopes reference",
    );
    expect(merged.every((q) => q.text.includes("Gmail API"))).toBe(true);
    expect(
      retryQueries(name, ["steps", "scopes"]).every((q) =>
        q.text.includes("Gmail API"),
      ),
    ).toBe(true);
  });
});
