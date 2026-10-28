/**
 * File: GuideConflicts.tsx
 * Purpose: Guide section 7: sources that disagree. Shown only when there are any, or on a partial guide.
 * Exports: GuideConflicts
 * Used by: components/guide/GuideView.tsx
 */
import type { ReactElement } from "react";
import { PageSection } from "@/components/shared/PageSection";
import type { Conflict } from "@/mocks/types";
import { ConflictCard } from "./ConflictCard";
import { MissingSection } from "./MissingSection";

type GuideConflictsProps = {
  conflicts: readonly Conflict[];
  isMissing: boolean;
};

export function GuideConflicts({
  conflicts,
  isMissing,
}: GuideConflictsProps): ReactElement | null {
  if (conflicts.length === 0 && !isMissing) return null;

  return (
    <PageSection
      id="conflicts"
      title="When sources disagree"
      description="Stamp keeps both claims and says which one it trusts."
    >
      {isMissing ? (
        <MissingSection />
      ) : (
        <div className="grid gap-4 desktop:grid-cols-2">
          {conflicts.map((conflict) => (
            <ConflictCard key={conflict.id} conflict={conflict} />
          ))}
        </div>
      )}
    </PageSection>
  );
}
