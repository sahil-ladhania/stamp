/**
 * File: guide-mapper.test.ts
 * Purpose: Tests Prisma guide row to shared Guide mapping.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { toGuide, toGuideSummary } from "./guide-mapper.js";
import { sampleGuideRow } from "./fixtures/sample-guide-row.js";

describe("guide-mapper", () => {
  it("overlays column slug when JSON drifted", () => {
    const row = sampleGuideRow({
      slug: "hubspot",
      data: {
        ...(sampleGuideRow().data as object),
        slug: "wrong-slug",
      },
    });
    const guide = toGuide(row);
    expect(guide.slug).toBe("hubspot");
    expect(guide.mode).toBe("library");
    expect(guide.archetype).toBe("hidden_limits");
  });

  it("maps summary list fields", () => {
    const summary = toGuideSummary(sampleGuideRow());
    expect(summary).toEqual({
      slug: "hubspot",
      appName: "HubSpot",
      archetype: "hidden_limits",
      difficulty: 3,
      mode: "library",
      asOf: "2026-01-15T00:00:00.000Z",
    });
  });
});
