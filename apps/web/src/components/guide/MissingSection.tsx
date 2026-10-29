/**
 * File: MissingSection.tsx
 * Purpose: Marks a section whose claims are all Uncertain, so the gap is visible instead of silent. The claims stay visible below it.
 * Exports: MissingSection
 * Used by: components/guide/StepsSection.tsx, BlockersSection.tsx, GuideConflicts.tsx
 */
import type { ReactElement } from "react";
import { CircleHelp } from "lucide-react";
import { Callout } from "@/components/shared/Callout";

export function MissingSection(): ReactElement {
  return (
    <Callout icon={CircleHelp}>
      Stamp could not confirm anything in this section. Retry the run to try again.
    </Callout>
  );
}
