/**
 * File: GuideView.tsx
 * Purpose: One guide in the fixed order from docs/design-system.md: header, verdict, next step and top blocker,
 *          milestones, steps, blockers, conflicts, sources, share.
 * Exports: GuideView
 * Used by: pages/GuidePage.tsx
 */
import type { ReactElement } from "react";
import { Container } from "@/components/layout/Container";
import { GUIDE_SECTION } from "@/mocks/guide-scenarios";
import type { Guide } from "@/mocks/types";
import { BlockersSection } from "./BlockersSection";
import { GuideConflicts } from "./GuideConflicts";
import { GuideHeader } from "./GuideHeader";
import { MilestonesSection } from "./MilestonesSection";
import { PartialNotice } from "./PartialNotice";
import { ShareStrip } from "./ShareStrip";
import { SourcesSection } from "./SourcesSection";
import { StartHereSection } from "./StartHereSection";
import { StepsSection } from "./StepsSection";
import { VerdictStamp } from "./VerdictStamp";

export function GuideView({ guide }: { guide: Guide }): ReactElement {
  const isPartial = guide.status === "partial";
  const isMissing = (section: string): boolean =>
    guide.uncertainSections.includes(section);

  return (
    <>
      <Container className="flex flex-col gap-8 py-12">
        <GuideHeader guide={guide} />
        {isPartial && <PartialNotice sections={guide.uncertainSections} />}
        <VerdictStamp guide={guide} size="md" hasHeader={false} />
      </Container>
      <StartHereSection
        step={guide.steps.find((step) => step.id === guide.nextStepId)}
        blocker={guide.blockers.find(
          (blocker) => blocker.id === guide.topBlockerId,
        )}
      />
      <MilestonesSection milestones={guide.milestones} />
      <StepsSection
        steps={guide.steps}
        isMissing={isMissing(GUIDE_SECTION.steps)}
      />
      <BlockersSection
        blockers={guide.blockers}
        topBlockerId={guide.topBlockerId}
        isMissing={isMissing(GUIDE_SECTION.blockers)}
      />
      <GuideConflicts
        conflicts={guide.conflicts}
        isMissing={isMissing(GUIDE_SECTION.conflicts)}
      />
      <SourcesSection guide={guide} />
      <ShareStrip slug={guide.slug} isPrimary={!isPartial} />
    </>
  );
}
