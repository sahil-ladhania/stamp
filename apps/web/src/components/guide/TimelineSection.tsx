/**
 * File: TimelineSection.tsx
 * Purpose: Guide section 2: how long it takes, as a timeline from the start to first test, approval wait and production. The line is not to
 *          scale: no source gives durations to scale it by. When no node states a duration, one callout says so and the nodes stay small.
 * Exports: TimelineSection
 * Used by: components/guide/GuideView.tsx
 */
import type { ReactElement } from "react";
import { Callout } from "@/components/shared/Callout";
import { PageSection } from "@/components/shared/PageSection";
import type { Milestone } from "@/types/guide-model";
import { TimelineNode } from "./TimelineNode";
import { getTimelineNodes, hasAnyDuration } from "./timeline-nodes";

export function TimelineSection({ milestones }: { milestones: readonly [Milestone, Milestone] }): ReactElement {
  const nodes = getTimelineNodes(milestones);

  return (
    <PageSection
      id="timeline"
      title="Timeline"
      description="How long it takes, from your first test connection to production."
    >
      {!hasAnyDuration(nodes) && (
        <Callout title="No durations found in the sources">Stamp could not read a clear time for any step.</Callout>
      )}
      {/* The start is a marker with a name, so it takes only what it needs. */}
      <ol className="flex flex-col gap-9 desktop:grid desktop:grid-cols-[auto_repeat(3,minmax(0,1fr))] desktop:gap-x-7">
        {nodes.map((node) => (
          <TimelineNode key={node.id} node={node} />
        ))}
      </ol>
    </PageSection>
  );
}
