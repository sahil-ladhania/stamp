/**
 * File: MissingSection.tsx
 * Purpose: Stands in for a section a partial run did not finish, so the gap is visible instead of silent.
 * Exports: MissingSection
 * Used by: components/guide/StepsSection.tsx, BlockersSection.tsx, GuideConflicts.tsx
 */
import type { ReactElement } from "react";
import { CircleHelp } from "lucide-react";

export function MissingSection(): ReactElement {
  return (
    <p className="flex items-start gap-3 rounded-md border border-uncertain bg-uncertain-bg p-4 text-body text-ink">
      <CircleHelp aria-hidden className="mt-0.5 size-5 shrink-0" />
      Uncertain: Stamp did not finish this section. Retry the run to fill it in.
    </p>
  );
}
