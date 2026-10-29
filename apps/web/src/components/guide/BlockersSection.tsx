/**
 * File: BlockersSection.tsx
 * Purpose: Guide section 5: every blocker with its fix. An Uncertain or empty section says so, and keeps whatever blockers there are.
 * Exports: BlockersSection
 * Used by: components/guide/GuideView.tsx
 */
import type { ReactElement } from "react";
import { PageSection } from "@/components/shared/PageSection";
import { UnknownValue } from "@/components/shared/UnknownValue";
import type { Blocker } from "@/types/guide-model";
import { BlockerCallout } from "./BlockerCallout";
import { MissingSection } from "./MissingSection";

type BlockersSectionProps = {
  blockers: readonly Blocker[];
  topBlockerId: string | null;
  isMissing: boolean;
};

export function BlockersSection({ blockers, topBlockerId, isMissing }: BlockersSectionProps): ReactElement {
  return (
    <PageSection id="blockers" title="Blockers" description="What can stop you, and how to get unstuck.">
      {isMissing && <MissingSection />}
      {blockers.length === 0 && !isMissing && <UnknownValue text="No blockers found" />}
      {blockers.length > 0 && (
        <ul className="flex flex-col gap-3">
          {blockers.map((blocker) => (
            <BlockerCallout key={blocker.id} blocker={blocker} isTop={blocker.id === topBlockerId} />
          ))}
        </ul>
      )}
    </PageSection>
  );
}
