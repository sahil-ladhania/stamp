/**
 * File: MilestonesSection.tsx
 * Purpose: Guide section 4: how long it takes, as the milestone track.
 * Exports: MilestonesSection
 * Used by: components/guide/GuideView.tsx
 */
import type { ReactElement } from "react";
import { PageSection } from "@/components/shared/PageSection";
import type { Milestone } from "@/types/guide-model";
import { MilestoneBar } from "./MilestoneBar";

export function MilestonesSection({
  milestones,
}: {
  milestones: readonly Milestone[];
}): ReactElement {
  return (
    <PageSection
      id="milestones"
      title="How long it takes"
      description="Two milestones: your first test connection and production."
    >
      <MilestoneBar milestones={milestones} />
    </PageSection>
  );
}
