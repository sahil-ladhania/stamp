/**
 * File: decide.test.ts
 * Purpose: Tests the official-domain decision: clear winner, ambiguity at its threshold, same-brand domains and no match.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import type { Candidate } from "./candidates.js";
import { RESOLVE_TUNING, decideOfficial } from "./decide.js";

const candidate = (
  domain: string,
  score: number,
  match: Candidate["match"] = "exact",
): Candidate => ({
  domain,
  label: domain.split(".")[0] ?? domain,
  match,
  score,
  hits: 1,
});

describe("decideOfficial", () => {
  it("is none when there are no candidates", () => {
    expect(decideOfficial([])).toEqual({ kind: "none" });
  });

  it("is none when the best candidate does not match the name, so junk results pick nothing", () => {
    expect(decideOfficial([candidate("example.org", 2, "none")])).toEqual({
      kind: "none",
    });
  });

  it("picks the leader when it is the only named candidate", () => {
    expect(decideOfficial([candidate("notion.com", 6)])).toEqual({
      kind: "official",
      domain: "notion.com",
    });
  });

  it("picks the leader when the runner-up is well behind", () => {
    const decision = decideOfficial([
      candidate("mercury.com", 5),
      candidate("mercuryapp.io", 2, "partial"),
    ]);
    expect(decision).toEqual({ kind: "official", domain: "mercury.com" });
  });

  it("is ambiguous when two differently named candidates are within 60% of the leader", () => {
    const decision = decideOfficial([
      candidate("mercury.com", 5),
      candidate("mercuryapp.io", 4, "partial"),
    ]);
    expect(decision).toEqual({
      kind: "ambiguous",
      options: [
        { name: "Mercury", domain: "mercury.com" },
        { name: "Mercuryapp", domain: "mercuryapp.io" },
      ],
    });
  });

  it("treats exactly 60% as ambiguous and anything below as not", () => {
    expect(
      decideOfficial([candidate("a.com", 5), candidate("b.com", 3)]).kind,
    ).toBe("ambiguous");
    expect(
      decideOfficial([candidate("a.com", 5), candidate("b.com", 2.99)]).kind,
    ).toBe("official");
  });

  it("is not ambiguous when the runner-up only matches on a page title", () => {
    expect(
      decideOfficial([candidate("a.com", 5), candidate("b.com", 4.5, "title")])
        .kind,
    ).toBe("official");
  });

  it("counts two domains with the same brand label as one app, not an ambiguity", () => {
    const same = [
      candidate("slack.com", 5),
      { ...candidate("slack.dev", 4.8), label: "slack" },
    ];
    expect(decideOfficial(same)).toEqual({
      kind: "official",
      domain: "slack.com",
    });
  });

  it("judges ambiguity by the best-scoring candidate of each brand label", () => {
    const decision = decideOfficial([
      candidate("a.com", 10),
      candidate("c.com", 3),
      { ...candidate("a.io", 2), label: "a" },
    ]);
    expect(decision).toEqual({ kind: "official", domain: "a.com" });
  });

  it("shows at most 3 options, best first, and only those within the ratio", () => {
    const decision = decideOfficial([
      candidate("a.com", 10),
      candidate("b.com", 9),
      candidate("c.com", 8),
      candidate("d.com", 7),
      candidate("e.com", 2),
    ]);
    expect(decision.kind).toBe("ambiguous");
    if (decision.kind === "ambiguous") {
      expect(decision.options.map((o) => o.domain)).toEqual([
        "a.com",
        "b.com",
        "c.com",
      ]);
    }
  });

  it("uses the tuning passed in", () => {
    const pair = [candidate("a.com", 5), candidate("b.com", 3)];
    expect(
      decideOfficial(pair, { ambiguityRatio: 0.9, maxOptions: 3 }).kind,
    ).toBe("official");
    expect(
      decideOfficial(pair, { ambiguityRatio: 0.5, maxOptions: 3 }).kind,
    ).toBe("ambiguous");
  });

  it("starts with a 60% ratio and 3 options", () => {
    expect(RESOLVE_TUNING).toEqual({ ambiguityRatio: 0.6, maxOptions: 3 });
  });
});
