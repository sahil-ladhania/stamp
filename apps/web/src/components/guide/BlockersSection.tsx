/**
 * File: BlockersSection.tsx
 * Purpose: Guide section 6: every blocker with its fix, or a missing-section note on a partial guide.
 * Exports: BlockersSection
 * Used by: components/guide/GuideView.tsx
 */
import type { ReactElement } from "react";
import { PageSection } from "@/components/shared/PageSection";
import type { Blocker } from "@/mocks/types";
import { BlockerCard } from "./BlockerCard";
import { MissingSection } from "./MissingSection";

type BlockersSectionProps = {
  blockers: readonly Blocker[];
  topBlockerId: string;
  isMissing: boolean;
};

export function BlockersSection({
  blockers,
  topBlockerId,
  isMissing,
}: BlockersSectionProps): ReactElement {
  return (
    <PageSection
      id="blockers"
      title="Blockers"
      description="What can stop you, and how to get unstuck."
    >
      {isMissing ? (
        <MissingSection />
      ) : (
        <ul className="flex flex-col gap-4">
          {blockers.map((blocker) => (
            <BlockerCard
              key={blocker.id}
              blocker={blocker}
              isTop={blocker.id === topBlockerId}
            />
          ))}
        </ul>
      )}
    </PageSection>
  );
}
