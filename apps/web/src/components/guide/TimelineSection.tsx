/**
 * File: TimelineSection.tsx
 * Purpose: Guide section 2: how long it takes, as a timeline from the start to first test, approval wait and production. The line
 *          is not to scale: no source gives durations to scale it by.
 * Exports: TimelineSection
 * Used by: components/guide/GuideView.tsx
 */
import type { ReactElement } from "react";
import { PageSection } from "@/components/shared/PageSection";
import type { Milestone } from "@/types/guide-model";
import { TimelineNode } from "./TimelineNode";
import { getTimelineNodes } from "./timeline-nodes";

export function TimelineSection({ milestones }: { milestones: readonly [Milestone, Milestone] }): ReactElement {
  return (
    <PageSection
      id="timeline"
      title="Timeline"
      description="How long it takes, from your first test connection to production."
    >
      <ol className="flex flex-col gap-9 desktop:grid desktop:grid-cols-4 desktop:gap-x-7">
        {getTimelineNodes(milestones).map((node) => (
          <TimelineNode key={node.id} node={node} />
        ))}
      </ol>
    </PageSection>
  );
}
