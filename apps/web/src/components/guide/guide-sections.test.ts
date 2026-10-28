/**
 * File: guide-sections.test.ts
 * Purpose: Tests the guide's section navigation: its order, the conflicts entry, and the Uncertain marker.
 * Exports: none
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { conflictGuide, partialGuide } from "@/test-support/guide-fixtures";
import { sampleGuide } from "@/test-support/sample-data";
import { mapGuide } from "@/utils/map-guide";
import { getGuideNavItems } from "./guide-sections";

describe("getGuideNavItems", () => {
  it("lists the sections in page order, with no conflicts entry when there are none", () => {
    const ids = getGuideNavItems(mapGuide(sampleGuide)).map((item) => item.id);
    expect(ids).toEqual(["verdict", "timeline", "steps", "requirements", "blockers", "sources"]);
  });

  it("adds the conflicts entry when the guide has conflicts", () => {
    const ids = getGuideNavItems(mapGuide(conflictGuide)).map((item) => item.id);
    expect(ids).toContain("conflicts");
  });

  it("marks a section that is mostly Uncertain", () => {
    const blockers = getGuideNavItems(mapGuide(partialGuide)).find((item) => item.id === "blockers");
    expect(blockers?.isUncertain).toBe(true);
  });
});
