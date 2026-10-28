/**
 * File: SourcesSection.tsx
 * Purpose: Guide section 9: every source the guide cites, plus the verification summary.
 * Exports: SourcesSection
 * Used by: components/guide/GuideView.tsx
 */
import type { ReactElement } from "react";
import { PageSection } from "@/components/shared/PageSection";
import { SourceLink } from "@/components/shared/SourceLink";
import type { Guide } from "@/types/guide-model";
import { TIER_LABEL } from "@/utils/source-tier";
import { VerificationSummary } from "./VerificationSummary";

export function SourcesSection({ guide }: { guide: Guide }): ReactElement {
  return (
    <PageSection id="sources" title="Sources and verification">
      <div className="grid gap-8 desktop:grid-cols-12 desktop:items-start">
        <ul className="flex flex-col divide-y divide-rule border-y border-rule desktop:col-span-7">
          {guide.sources.map((source) => (
            <li
              key={source.url}
              className="flex flex-col gap-1 py-3 tablet:flex-row tablet:items-baseline tablet:justify-between tablet:gap-4"
            >
              <SourceLink source={source} />
              <span className="text-data text-ink-muted">
                {TIER_LABEL[source.tier]}
              </span>
            </li>
          ))}
        </ul>
        <div className="desktop:col-span-5">
          <VerificationSummary guide={guide} />
        </div>
      </div>
    </PageSection>
  );
}
