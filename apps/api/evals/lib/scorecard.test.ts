/**
 * File: scorecard.test.ts
 * Purpose: Tests the scorecard markdown: one row per app, a totals row, the success-metric table and the manual-check list.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { scoreApp } from "../scoring/score-app.js";
import { failedCapture, goodCapture } from "./fixtures/run-capture.js";
import { brokenCapture } from "./fixtures/broken-capture.js";
import { loadGolden } from "./golden.js";
import { renderScorecard } from "./scorecard.js";

const gmail = (await loadGolden()).find((g) => g.slug === "gmail")!;
const good = scoreApp(goodCapture(), gmail, 0.2);
const broken = {
  ...scoreApp(brokenCapture(), gmail, null),
  slug: "gmail-broken",
};
const failed = {
  ...scoreApp(failedCapture(), gmail, 0.05),
  slug: "gmail-failed",
};

const meta = {
  label: "tuning",
  generatedAt: "2026-10-29T10:00:00.000Z",
  runDir: "evals/runs/2026-10-29T10-00-00Z",
};
const card = renderScorecard([good, broken, failed], meta);
const lines = card.split("\n");
const row = (slug: string) =>
  lines.find((line) => line.startsWith(`| ${slug} |`)) ?? "";

describe("renderScorecard", () => {
  it("starts with the set, the time and the run folder", () => {
    expect(lines[0]).toBe("# Scorecard: tuning");
    expect(card).toContain("2026-10-29T10:00:00.000Z");
    expect(card).toContain("evals/runs/2026-10-29T10-00-00Z");
  });

  it("explains the two compound columns", () => {
    expect(card).toContain("On good pages:");
    expect(card).toContain("Golden pages: read / found by the search / cited");
  });

  it("has one row per app and a totals row, with one column per metric", () => {
    const header = lines.find((line) => line.startsWith("| App |")) ?? "";
    const columns = header.split("|").filter((cell) => cell.trim() !== "");
    expect(columns.map((c) => c.trim())).toEqual([
      "App",
      "Status",
      "Time (s)",
      "In 120 s",
      "Pages",
      "Retries",
      "Wrong-product",
      "Gate",
      "Wait",
      "Real scopes",
      "Fake scopes",
      "Durations",
      "Top blocker",
      "Contradictions",
      "Coverage",
      "Uncertain",
      "On good pages",
      "Golden pages",
      "Tokens",
      "Credits",
      "Cost",
    ]);
    expect(row("gmail")).not.toBe("");
    expect(row("gmail-broken")).not.toBe("");
    expect(row("gmail-failed")).not.toBe("");
    expect(lines.some((line) => line.startsWith("| **Total** |"))).toBe(true);
  });

  it("writes every row with the same number of cells as the header", () => {
    const cells = (line: string) => line.split("|").length;
    const header = lines.find((line) => line.startsWith("| App |")) ?? "";
    for (const slug of ["gmail", "gmail-broken", "gmail-failed"]) {
      expect(cells(row(slug))).toBe(cells(header));
    }
    expect(
      cells(lines.find((line) => line.startsWith("| **Total** |")) ?? ""),
    ).toBe(cells(header));
  });

  it("prints a good run's verdicts and an unknown cost as n/a", () => {
    expect(row("gmail")).toContain("match (security_assessment)");
    expect(row("gmail")).toContain("pass");
    expect(row("gmail-broken")).toContain("wrong (none)");
    expect(row("gmail-broken")).toContain("n/a");
  });

  it("shows the claims on good pages and the golden pages read, found and cited", () => {
    expect(row("gmail")).toMatch(/\| \d+\/\d+ \| 1\/2\/6 \|/);
    expect(row("gmail-failed")).toContain("| 0/0 | 0/0/6 |");
  });

  it("names the failure code of a failed run", () => {
    expect(row("gmail-failed")).toContain("failed (NO_PUBLIC_DOCS)");
  });

  it("lists the success metrics with their targets", () => {
    for (const name of [
      "Wrong-product sources",
      "Sourced claims that contradict the golden set",
      "Review gate correct",
      "Apps with at least 2 real scopes",
      "Fake or tutorial scopes",
      "Milestone fields that are durations or Unknown",
      "Top blocker is a setup or approval blocker",
      "Runs that end within 120 s",
      "p95 run time",
      "Uncertain share",
      "Cost per run",
    ]) {
      expect(card).toContain(name);
    }
  });

  it("lists what needs a manual look under the app's name", () => {
    expect(card).toContain("## Needs a manual look");
    expect(card).toContain(
      "gmail-broken: official pages outside the golden path hints",
    );
  });

  it("says so when nothing needs a manual look", () => {
    expect(
      renderScorecard(
        [
          {
            ...good,
            sources: { ...good.sources, offHint: [], thirdParty: [] },
          },
        ],
        meta,
      ),
    ).toContain("Nothing flagged.");
  });
});
