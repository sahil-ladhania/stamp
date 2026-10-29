/**
 * File: missing-sections.test.ts
 * Purpose: Tests which sections trigger the retry: an unknown review gate, and steps, scopes and blockers with no Sourced claim.
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

/** Sourced claims for every watched section. */
const COMPLETE = [
  make("steps.0.detail", "sourced"),
  make("scopes.0.reason", "sourced"),
  make("blockers.0.text", "sourced"),
];
const without = (section: string): Claim[] =>
  COMPLETE.filter((claim) => !claim.id.startsWith(`${section}.`));
const missing = (claims: Claim[], gateKnown = true) =>
  missingSections(claims, { gateKnown });

describe("missingSections", () => {
  it("reports nothing when the gate is known and steps, scopes and blockers each have a Sourced claim", () => {
    expect(missing(COMPLETE)).toEqual([]);
  });

  it("reports a section that has no claims at all", () => {
    expect(missing(without("steps"))).toEqual(["steps"]);
    expect(missing(without("scopes"))).toEqual(["scopes"]);
    expect(missing(without("blockers"))).toEqual(["blockers"]);
  });

  it("reports the review gate when it is unknown, first, because the difficulty rests on it", () => {
    expect(missing(COMPLETE, false)).toEqual(["reviewGate"]);
    expect(missing([], false)).toEqual([
      "reviewGate",
      "steps",
      "scopes",
      "blockers",
    ]);
  });

  it("reports a section whose claims are all Uncertain, because no quote matched", () => {
    expect(
      missing([
        make("steps.0.detail", "uncertain"),
        make("steps.0.effort", "uncertain"),
        make("scopes.0.reason", "sourced"),
        make("blockers.0.text", "sourced"),
      ]),
    ).toEqual(["steps"]);
  });

  it("counts a Tested claim as matched", () => {
    expect(
      missing([
        make("steps.0.detail", "tested"),
        make("scopes.0.reason", "tested"),
        make("blockers.0.text", "tested"),
      ]),
    ).toEqual([]);
  });

  it("counts one Sourced claim as enough, even among Uncertain ones", () => {
    expect(
      missing([
        make("steps.0.detail", "uncertain"),
        make("steps.1.detail", "sourced"),
        make("scopes.0.reason", "sourced"),
        make("blockers.0.text", "sourced"),
      ]),
    ).toEqual([]);
  });

  it("does not report sections that may honestly be empty", () => {
    expect(missing(COMPLETE)).not.toContain("limits");
  });

  it("does not let a claim in another section stand in, even when its id starts the same", () => {
    expect(
      missing([
        make("stepsy.0", "sourced"),
        make("scopes.0.reason", "sourced"),
        make("blockers.0.text", "sourced"),
      ]),
    ).toEqual(["steps"]);
  });
});
