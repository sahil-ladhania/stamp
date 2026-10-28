/**
 * File: timeline-nodes.test.ts
 * Purpose: Tests the timeline nodes: their order, the claims behind each, and a node whose text states no duration.
 * Exports: none
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { sampleGuide } from "@/test-support/sample-data";
import { mapGuide } from "@/utils/map-guide";
import { getTimelineNodes } from "./timeline-nodes";

describe("getTimelineNodes", () => {
  const guide = mapGuide(sampleGuide);
  const nodes = getTimelineNodes(guide.milestones);

  it("runs from the start to production", () => {
    expect(nodes.map((node) => node.id)).toEqual(["start", "first-test", "approval", "production"]);
  });

  it("gives the start no claims and no duration", () => {
    expect(nodes[0]?.parts).toEqual([]);
    expect(nodes[0]?.duration).toBeUndefined();
  });

  it("keeps the milestone claims, so each node carries its label", () => {
    expect(nodes[1]?.parts.map((part) => part.claim)).toEqual([guide.milestones[0].effort, guide.milestones[0].wait]);
    expect(nodes[2]?.parts[0]?.claim).toBe(guide.milestones[1].wait);
    expect(nodes[3]?.parts[0]?.claim).toBe(guide.milestones[1].effort);
  });

  it("uses null for a duration the text does not state", () => {
    expect(nodes.slice(1).every((node) => node.duration === null || typeof node.duration === "string")).toBe(true);
  });
});
