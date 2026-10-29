/**
 * File: SourcesSection.tsx
 * Purpose: Guide section 7: every source the guide cites, plus the verification summary.
 * Exports: SourcesSection
 * Used by: components/guide/GuideView.tsx
 */
import type { ReactElement } from "react";
import { PageSection } from "@/components/shared/PageSection";
import type { Guide } from "@/types/guide-model";
import { SourcesTable } from "./SourcesTable";
import { VerificationBar } from "./VerificationBar";

export function SourcesSection({ guide }: { guide: Guide }): ReactElement {
  return (
    <PageSection id="sources" title="Sources and verification">
      <div className="grid gap-8 tablet:grid-cols-12 tablet:items-start">
        <div className="min-w-0 tablet:col-span-7">
          <SourcesTable sources={guide.sources} />
        </div>
        <div className="tablet:col-span-5">
          <VerificationBar guide={guide} />
        </div>
      </div>
    </PageSection>
  );
}
