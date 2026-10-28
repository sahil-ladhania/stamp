/**
 * File: timeline-nodes.ts
 * Purpose: The four nodes of the timeline (start, first test connection, approval wait, production) built from a guide's two
 *          milestones. Each node keeps the claims behind it and the duration its text states, if any. Pure.
 * Exports: TimelinePart, TimelineNodeData, getTimelineNodes
 * Used by: components/guide/TimelineSection.tsx
 */
import type { Claim, Milestone } from "@/types/guide-model";
import { milestoneDurations } from "@/utils/milestone-durations";

export type TimelinePart = { label?: string; claim: Claim };

export type TimelineNodeData = {
  id: "start" | "first-test" | "approval" | "production";
  title: string;
  /** The duration the text states. Null when it states none; undefined for the start, which has no duration. */
  duration: string | null | undefined;
  parts: TimelinePart[];
};

export function getTimelineNodes(milestones: readonly [Milestone, Milestone]): TimelineNodeData[] {
  const [firstTest, production] = milestones;
  const durations = milestoneDurations(milestones);
  return [
    { id: "start", title: "Start", duration: undefined, parts: [] },
    {
      id: "first-test",
      title: "First test connection",
      duration: durations.firstTest,
      parts: [{ claim: firstTest.effort }, { label: "Waits on", claim: firstTest.wait }],
    },
    { id: "approval", title: "Approval wait", duration: durations.approvalWait, parts: [{ claim: production.wait }] },
    { id: "production", title: "Production", duration: durations.production, parts: [{ claim: production.effort }] },
  ];
}
