/**
 * File: contradictions.test.ts
 * Purpose: Tests finding Sourced or Tested facts that contradict the golden set: gate, wait, fake scopes and wrong-product citations.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import {
  findContradictions,
  type ContradictionInput,
} from "./contradictions.js";

const CLEAN: ContradictionInput = {
  gate: { found: "security_assessment", verdict: "match" },
  wait: { found: "42 days", verdict: "match" },
  scopes: [{ name: "gmail.readonly", kind: "real", label: "sourced" }],
  claims: [{ label: "sourced", wrongProductUrls: [] }],
};

describe("findContradictions", () => {
  it("finds nothing in a clean run", () => {
    expect(findContradictions(CLEAN)).toEqual([]);
  });

  it("reports a wrong gate", () => {
    const found = findContradictions({
      ...CLEAN,
      gate: { found: "none", verdict: "wrong" },
    });
    expect(found).toEqual([
      {
        field: "reviewGate",
        detail: "found none, which the golden set does not accept",
      },
    ]);
  });

  it("reports a wrong wait", () => {
    const found = findContradictions({
      ...CLEAN,
      wait: { found: "1 to 2 days", verdict: "wrong" },
    });
    expect(found.map((c) => c.field)).toEqual(["approvalWait"]);
  });

  it("does not report an unknown gate or wait", () => {
    const found = findContradictions({
      ...CLEAN,
      gate: { found: "unknown", verdict: "unknown" },
      wait: { found: "unknown", verdict: "unknown" },
    });
    expect(found).toEqual([]);
  });

  it("reports a fake scope only when its claim is Sourced or Tested", () => {
    const sourced = findContradictions({
      ...CLEAN,
      scopes: [{ name: "app.read", kind: "fake", label: "sourced" }],
    });
    const uncertain = findContradictions({
      ...CLEAN,
      scopes: [{ name: "app.read", kind: "fake", label: "uncertain" }],
    });
    expect(sourced).toEqual([
      {
        field: "scopes",
        detail: "app.read is not a real scope and its claim is sourced",
      },
    ]);
    expect(uncertain).toEqual([]);
  });

  it("reports a Tested claim that cites a wrong-product page", () => {
    const found = findContradictions({
      ...CLEAN,
      claims: [
        {
          label: "tested",
          wrongProductUrls: ["https://docs.cloud.google.com/contact-center/x"],
        },
      ],
    });
    expect(found).toEqual([
      {
        field: "source",
        detail:
          "tested claim cites a wrong-product page: https://docs.cloud.google.com/contact-center/x",
      },
    ]);
  });

  it("does not report an Uncertain claim that cites a wrong-product page", () => {
    const found = findContradictions({
      ...CLEAN,
      claims: [
        {
          label: "uncertain",
          wrongProductUrls: ["https://docs.cloud.google.com/contact-center/x"],
        },
      ],
    });
    expect(found).toEqual([]);
  });
});
