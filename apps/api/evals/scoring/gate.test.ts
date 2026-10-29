/**
 * File: gate.test.ts
 * Purpose: Tests matching the found review gate and approval wait against the golden set, including the two-accepted-values rule and the widened wait range.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { loadGolden, type Golden } from "../lib/golden.js";
import { scoreGate, scoreWait } from "./gate.js";

const all = await loadGolden();
const golden = (slug: string): Golden => {
  const found = all.find((g) => g.slug === slug);
  if (!found) throw new Error(`no golden ${slug}`);
  return found;
};

describe("scoreGate", () => {
  it("matches the primary gate", () => {
    expect(scoreGate("security_assessment", golden("gmail"))).toBe("match");
  });

  it("matches the one accepted alternate", () => {
    expect(scoreGate("required_to_scale", golden("gmail"))).toBe("match");
    expect(scoreGate("none", golden("microsoft"))).toBe("match");
  });

  it("marks a gate outside the accepted two as wrong", () => {
    expect(scoreGate("none", golden("gmail"))).toBe("wrong");
    expect(scoreGate("optional_listing", golden("microsoft"))).toBe("wrong");
  });

  it("treats an unknown gate as unknown, not wrong", () => {
    expect(scoreGate("unknown", golden("gmail"))).toBe("unknown");
  });
});

describe("scoreWait", () => {
  const gmail = golden("gmail");

  it("matches a range that overlaps the documented wait", () => {
    expect(scoreWait({ minDays: 42, maxDays: 42 }, gmail)).toBe("match");
    expect(scoreWait({ minDays: 28, maxDays: 56 }, gmail)).toBe("match");
  });

  it("matches the alternate range for sensitive scopes", () => {
    expect(scoreWait({ minDays: 10, maxDays: 14 }, gmail)).toBe("match");
  });

  it("marks a range far from both accepted waits as wrong", () => {
    expect(scoreWait({ minDays: 1, maxDays: 2 }, gmail)).toBe("wrong");
    expect(scoreWait({ minDays: 300, maxDays: 400 }, gmail)).toBe("wrong");
  });

  it("marks no wait as wrong when the golden documents a long review", () => {
    expect(scoreWait("none", gmail)).toBe("wrong");
  });

  it("treats an unknown wait as unknown", () => {
    expect(scoreWait("unknown", gmail)).toBe("unknown");
  });

  it("accepts no wait for a golden that documents none", () => {
    expect(scoreWait("none", golden("github"))).toBe("match");
    expect(scoreWait({ minDays: 7, maxDays: 14 }, golden("github"))).toBe(
      "wrong",
    );
  });

  it("treats no wait as zero days for a golden that starts at zero", () => {
    expect(scoreWait("none", golden("microsoft"))).toBe("match");
    expect(scoreWait({ minDays: 14, maxDays: 60 }, golden("microsoft"))).toBe(
      "wrong",
    );
  });

  it("calls an invented number wrong when the golden says no wait is documented", () => {
    const calendly = golden("calendly");
    expect(scoreWait({ minDays: 7, maxDays: 14 }, calendly)).toBe("wrong");
    expect(scoreWait("unknown", calendly)).toBe("unknown");
  });

  it("accepts no wait when the golden documents none and the gate allows none", () => {
    expect(scoreWait("none", golden("calendly"))).toBe("match");
  });
});
