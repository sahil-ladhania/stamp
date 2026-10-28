/**
 * File: verdict.test.ts
 * Purpose: Tests the verdict rows: their order, the claim each one keeps, and a missing blocker or step.
 * Exports: none
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { sampleGuide } from "@/test-support/sample-data";
import { emptyPartialGuide } from "@/test-support/guide-fixtures";
import { mapGuide } from "./map-guide";
import { getVerdictRows } from "./verdict";

describe("getVerdictRows", () => {
  it("lists the claim rows in reading order", () => {
    const ids = getVerdictRows(mapGuide(sampleGuide)).map((row) => row.id);
    expect(ids).toEqual(["firstTest", "production", "approvalWait", "topBlocker", "nextStep"]);
  });

  it("keeps the claim, so the row carries the label of its claim", () => {
    const guide = mapGuide(sampleGuide);
    const rows = getVerdictRows(guide);
    expect(rows[0]?.claim).toBe(guide.milestones[0].effort);
    expect(rows[2]?.claim).toBe(guide.milestones[1].wait);
  });

  it("links each row to the section that holds the full version", () => {
    const sections = getVerdictRows(mapGuide(sampleGuide)).map((row) => row.section);
    expect(sections).toEqual(["timeline", "timeline", "timeline", "blockers", "steps"]);
  });

  it("shows the blocker by its title and the step by its title", () => {
    const guide = mapGuide(sampleGuide);
    const rows = getVerdictRows(guide);
    const blocker = guide.blockers.find((item) => item.id === guide.topBlockerId);
    const step = guide.steps.find((item) => item.id === guide.nextStepId);
    expect(rows[3]?.value).toBe(blocker?.title);
    expect(rows[4]?.value).toBe(step?.title);
  });

  it("keeps the rows of a guide with no blocker or step, with no claim", () => {
    const rows = getVerdictRows(mapGuide(emptyPartialGuide));
    expect(rows).toHaveLength(5);
    expect(rows[3]?.claim).toBeNull();
    expect(rows[4]?.claim).toBeNull();
  });
});
