/**
 * File: report.test.ts
 * Purpose: Tests the resolve stress report: counts by outcome and type, one row per provider, and the search detail only for providers that were not ok.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import type { Entry, SearchFn } from "./resolve-one.js";
import { resolveOne } from "./resolve-one.js";
import { describeDecision, renderReport } from "./report.js";

const entry = (
  typed: string,
  expected: string[],
  types: Entry["types"] = ["dev_subdomain"],
): Entry => ({
  typed,
  types,
  expected,
});
const search =
  (hits: { url: string; title: string }[]): SearchFn =>
  () =>
    Promise.resolve({ hits, credits: 1 });

async function records() {
  return [
    await resolveOne(
      entry("Spotify", ["spotify.com"]),
      search([
        { url: "https://developer.spotify.com/a", title: "Spotify API" },
      ]),
    ),
    await resolveOne(
      entry("Nothing", ["nothing.com"], ["common_word"]),
      search([{ url: "https://example.org/a", title: "Other" }]),
    ),
    await resolveOne(
      entry("youtube.com", ["google.com"], ["typed_domain"]),
      search([]),
    ),
  ];
}

describe("renderReport", () => {
  it("counts outcomes and credits, and has one row per provider", async () => {
    const report = renderReport(await records(), "Heading");
    expect(report).toContain("# Heading");
    expect(report).toContain(
      "3 providers, 2 searched, 3 Tavily credits reported. 1 looked a second time; 0 would look again",
    );
    expect(report).toContain("| ok | 1 |");
    expect(report).toContain("| wrong_domain | 1 |");
    expect(report).toContain("| no_docs | 1 |");
    expect(report).toContain(
      "| Spotify | dev_subdomain | spotify.com | official spotify.com | ok |",
    );
  });

  it("counts outcomes by type", async () => {
    const report = renderReport(await records(), "H");
    expect(report).toMatch(/\| common_word \| 1 \|.*\| 1 \|/);
  });

  it("shows what the search saw only for providers that were not ok", async () => {
    const report = renderReport(await records(), "H");
    expect(report).toContain("### Nothing: no_docs");
    expect(report).toContain("example.org");
    expect(report).not.toContain("### Spotify");
  });
});

describe("describeDecision", () => {
  it("says a typed domain was not searched", async () => {
    const [, , typed] = await records();
    expect(describeDecision(typed!)).toBe(
      "official youtube.com (typed, no search)",
    );
  });
});
