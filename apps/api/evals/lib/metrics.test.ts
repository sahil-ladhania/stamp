/**
 * File: metrics.test.ts
 * Purpose: Tests the success-metric definitions: names, targets for each selection, values read from a summary and how a value reads in a table.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { scoreApp } from "../scoring/score-app.js";
import { brokenCapture } from "./fixtures/broken-capture.js";
import { failedCapture, goodCapture } from "./fixtures/run-capture.js";
import { loadGolden } from "./golden.js";
import { METRICS, formatMetric } from "./metrics.js";
import { summarize } from "./summary.js";

const gmail = (await loadGolden()).find((g) => g.slug === "gmail")!;
const scores = [
  scoreApp(goodCapture(), gmail, 0.2),
  scoreApp(brokenCapture(), gmail, 0.1),
  scoreApp(failedCapture(), gmail, 0.05),
];
const summary = summarize(scores);
const byName = (name: string) => {
  const found = METRICS.find((metric) => metric.name === name);
  if (!found) throw new Error(`no metric ${name}`);
  return found;
};

describe("METRICS", () => {
  it("lists the eleven contract metrics and the three retrieval and precision ones", () => {
    expect(METRICS.map((metric) => metric.name)).toEqual([
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
      "Sourced claims on good pages",
      "Golden pages read",
      "Golden pages found by the search",
    ]);
  });

  it("reads each value from the summary", () => {
    expect(byName("Wrong-product sources").value(summary)).toBe(
      summary.wrongProductSources,
    );
    expect(
      byName("Top blocker is a setup or approval blocker").value(summary),
    ).toBe(summary.topBlocker.pass);
    expect(byName("Sourced claims on good pages").value(summary)).toBe(
      summary.goodShare,
    );
    expect(byName("Golden pages read").value(summary)).toBe(
      summary.goldenFetched,
    );
  });
});

describe("targets", () => {
  const target = (
    name: string,
    set: "tuning" | "holdout" | undefined,
    apps: number,
  ) => byName(name).target({ set, apps });

  it("gives the contract's pass counts for a full tuning or holdout set", () => {
    expect(target("Review gate correct", "tuning", 6)).toBe("at least 5 of 6");
    expect(target("Review gate correct", "holdout", 4)).toBe("at least 3 of 4");
    expect(target("Apps with at least 2 real scopes", "tuning", 6)).toBe(
      "at least 5 of 6",
    );
  });

  it("says a count target does not apply to a single app or a mixed selection", () => {
    expect(target("Review gate correct", "tuning", 1)).toBe(
      "n/a for this selection",
    );
    expect(target("Review gate correct", undefined, 10)).toBe(
      "n/a for this selection",
    );
    expect(target("Apps with at least 2 real scopes", "holdout", 4)).toBe(
      "n/a for this selection",
    );
  });

  it("states the fixed targets", () => {
    expect(target("Wrong-product sources", "tuning", 6)).toBe("0");
    expect(target("p95 run time", "tuning", 6)).toBe("at most 100 s");
    expect(target("Uncertain share", "tuning", 6)).toBe("report");
  });
});

describe("formatMetric", () => {
  it("writes a count against its total", () => {
    expect(formatMetric(byName("Review gate correct"), 2, summary)).toBe(
      "2 of 3",
    );
    expect(
      formatMetric(
        byName("Milestone fields that are durations or Unknown"),
        6,
        summary,
      ),
    ).toBe(`6 of ${summary.milestoneTotal}`);
  });

  it("writes a mean count with one decimal", () => {
    expect(formatMetric(byName("Review gate correct"), 2.333, summary)).toBe(
      "2.3 of 3",
    );
  });

  it("writes a plain count, a percent, seconds and dollars", () => {
    expect(formatMetric(byName("Wrong-product sources"), 5, summary)).toBe("5");
    expect(formatMetric(byName("Uncertain share"), 0.344, summary)).toBe("34%");
    expect(formatMetric(byName("p95 run time"), 37.84, summary)).toBe("37.8 s");
    expect(formatMetric(byName("Cost per run"), 0.1734, summary)).toBe("$0.17");
  });

  it("writes n/a for a value that is null", () => {
    expect(formatMetric(byName("Cost per run"), null, summary)).toBe("n/a");
  });

  it("can leave the total off, for the ends of a range", () => {
    expect(
      formatMetric(byName("Review gate correct"), 2, summary, {
        withTotal: false,
      }),
    ).toBe("2");
  });
});
