/**
 * File: GuideView.tsx
 * Purpose: One guide in the order from docs/design-system.md: header and verdict, timeline, steps, requirements and scopes,
 *          blockers, source conflicts, sources. The section navigation sits beside it on a wide screen and above it on a small one.
 * Exports: GuideView
 * Used by: pages/GuidePage.tsx
 */
import type { ReactElement } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionNav } from "@/components/nav/SectionNav";
import { Verdict } from "@/components/verdict/Verdict";
import { GuideSlugContext } from "@/hooks/useGuideSlug";
import type { Guide } from "@/types/guide-model";
import { GUIDE_SECTION } from "@/utils/uncertain-sections";
import { BlockersSection } from "./BlockersSection";
import { GuideConflicts } from "./GuideConflicts";
import { GuideHeader } from "./GuideHeader";
import { getGuideNavItems } from "./guide-sections";
import { PartialNotice } from "./PartialNotice";
import { RequirementsSection } from "./RequirementsSection";
import { SourcesSection } from "./SourcesSection";
import { StepsSection } from "./StepsSection";
import { TimelineSection } from "./TimelineSection";

export function GuideView({ guide }: { guide: Guide }): ReactElement {
  const isMissing = (section: string): boolean => guide.uncertainSections.includes(section);

  return (
    <GuideSlugContext.Provider value={guide.slug}>
      <PageContainer className="grid gap-x-12 desktop:grid-cols-[13rem_minmax(0,1fr)]">
        <SectionNav items={getGuideNavItems(guide)} />
        <div className="flex min-w-0 flex-col desktop:col-start-2 desktop:row-start-1">
          <div id="verdict" className="flex scroll-mt-24 flex-col gap-6 py-10">
            <GuideHeader guide={guide} />
            <Verdict guide={guide} variant="guide" hasIdentity={false} detailHref={(row) => `#${row.section}`} />
            {guide.coverage === "partial" && <PartialNotice sections={guide.uncertainSections} slug={guide.slug} />}
          </div>
          <TimelineSection milestones={guide.milestones} />
          <StepsSection steps={guide.steps} isMissing={isMissing(GUIDE_SECTION.steps)} />
          <RequirementsSection requirements={guide.requirements} scopes={guide.scopes} limits={guide.limits} />
          <BlockersSection
            blockers={guide.blockers}
            topBlockerId={guide.topBlockerId}
            isMissing={isMissing(GUIDE_SECTION.blockers)}
          />
          <GuideConflicts conflicts={guide.conflicts} isMissing={isMissing(GUIDE_SECTION.conflicts)} />
          <SourcesSection guide={guide} />
        </div>
      </PageContainer>
    </GuideSlugContext.Provider>
  );
}
