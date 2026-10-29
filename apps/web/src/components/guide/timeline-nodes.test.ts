/**
 * File: timeline-nodes.test.ts
 * Purpose: Tests the timeline nodes: their order, the claims behind each, and a node whose text states no duration.
 * Exports: none
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { sampleGuide } from "@/test-support/sample-data";
import { mapGuide } from "@/utils/map-guide";
import { emptyPartialGuide } from "@/test-support/guide-fixtures";
import { getTimelineNodes, hasAnyDuration, knownParts } from "./timeline-nodes";

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

describe("hasAnyDuration", () => {
  it("is false when no node states a duration", () => {
    const nodes = getTimelineNodes(mapGuide(emptyPartialGuide).milestones);
    expect(hasAnyDuration(nodes.map((node) => ({ ...node, duration: node.id === "start" ? undefined : null })))).toBe(false);
  });

  it("is true when one node does", () => {
    const nodes = getTimelineNodes(mapGuide(sampleGuide).milestones);
    expect(hasAnyDuration(nodes.map((node) => (node.id === "approval" ? { ...node, duration: "3 to 7 days" } : node)))).toBe(true);
  });
});

describe("knownParts", () => {
  const source = { url: "https://docs.example.com/a", title: "t", tier: "official" as const };
  const known = { id: "milestones.firstTest.effort", text: "About an hour.", label: "uncertain" as const, sources: [source] };
  const unknown = { id: "milestones.firstTest.wait", text: "Not found in the fetched sources.", label: "uncertain" as const, sources: [] };

  it("leaves out a part that is the unknown claim", () => {
    const node = {
      id: "first-test" as const,
      title: "First test connection",
      duration: null,
      parts: [{ claim: known }, { label: "Waits on", claim: unknown }],
    };
    expect(knownParts(node).map((part) => part.claim.id)).toEqual(["milestones.firstTest.effort"]);
  });

  it("keeps nothing for a node whose claims are all unknown, and for the start", () => {
    const allUnknown = { id: "approval" as const, title: "Approval wait", duration: null, parts: [{ claim: unknown }] };
    expect(knownParts(allUnknown)).toEqual([]);
    expect(knownParts(getTimelineNodes(mapGuide(sampleGuide).milestones)[0]!)).toEqual([]);
  });
});
