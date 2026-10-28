/**
 * File: missing-sections.test.ts
 * Purpose: Tests which sections trigger the retry: steps and scopes with no Sourced claim.
 * Exports: (none)
 * Used by: vitest
 */
import type { Claim } from "@stamp/schema";
import { describe, expect, it } from "vitest";
import { missingSections } from "./missing-sections.js";

const make = (id: string, label: Claim["label"]): Claim => ({
  id,
  text: "A fact.",
  label,
  sources:
    label === "uncertain"
      ? []
      : [
          {
            url: "https://docs.acme.com/x",
            quote: "A real quote here.",
            tier: "official",
          },
        ],
});

describe("missingSections", () => {
  it("reports nothing when steps and scopes each have a Sourced claim", () => {
    expect(
      missingSections([
        make("steps.0.detail", "sourced"),
        make("scopes.0.reason", "sourced"),
      ]),
    ).toEqual([]);
  });

  it("reports a section that has no claims at all", () => {
    expect(missingSections([make("scopes.0.reason", "sourced")])).toEqual([
      "steps",
    ]);
    expect(missingSections([])).toEqual(["steps", "scopes"]);
  });

  it("reports a section whose claims are all Uncertain, because no quote matched", () => {
    expect(
      missingSections([
        make("steps.0.detail", "uncertain"),
        make("steps.0.effort", "uncertain"),
        make("scopes.0.reason", "sourced"),
      ]),
    ).toEqual(["steps"]);
  });

  it("counts a Tested claim as matched", () => {
    expect(
      missingSections([
        make("steps.0.detail", "tested"),
        make("scopes.0.reason", "tested"),
      ]),
    ).toEqual([]);
  });

  it("counts one Sourced claim as enough, even among Uncertain ones", () => {
    expect(
      missingSections([
        make("steps.0.detail", "uncertain"),
        make("steps.1.detail", "sourced"),
        make("scopes.0.reason", "sourced"),
      ]),
    ).toEqual([]);
  });

  it("does not report sections that may honestly be empty", () => {
    expect(
      missingSections([
        make("steps.0.detail", "sourced"),
        make("scopes.0.reason", "sourced"),
      ]),
    ).not.toContain("limits");
  });

  it("does not let a claim in another section stand in, even when its id starts the same", () => {
    expect(
      missingSections([
        make("stepsy.0", "sourced"),
        make("scopes.0.reason", "sourced"),
      ]),
    ).toEqual(["steps"]);
  });
});
