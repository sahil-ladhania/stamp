/**
 * File: MissingSection.tsx
 * Purpose: Marks a section whose claims are all Uncertain, so the gap is visible instead of silent. The claims stay visible below it.
 * Exports: MissingSection
 * Used by: components/guide/StepsSection.tsx, BlockersSection.tsx, GuideConflicts.tsx
 */
import type { ReactElement } from "react";
import { UncertainNote } from "./UncertainNote";

export function MissingSection(): ReactElement {
  return (
    <UncertainNote>
      Uncertain: Stamp could not confirm anything in this section. Retry the run
      to try again.
    </UncertainNote>
  );
}
