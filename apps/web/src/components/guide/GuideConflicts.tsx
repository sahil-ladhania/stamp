/**
 * File: GuideConflicts.tsx
 * Purpose: Guide section 8: sources that disagree. Shown only when there are any, or on a partial guide where
 *          Stamp could not say whether it checked.
 * Exports: GuideConflicts
 * Used by: components/guide/GuideView.tsx
 */
import type { ReactElement } from "react";
import { PageSection } from "@/components/shared/PageSection";
import type { Conflict } from "@/types/guide-model";
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
      description="Stamp keeps both sources and says which one it trusts."
    >
      {isMissing && <MissingSection />}
      {conflicts.length > 0 && (
        <div className="grid gap-4 desktop:grid-cols-2">
          {conflicts.map((conflict) => (
            <ConflictCard key={conflict.id} conflict={conflict} />
          ))}
        </div>
      )}
    </PageSection>
  );
}
