/**
 * File: KindChip.tsx
 * Purpose: The kind of hard as a small neutral chip. It is set by code from the guide, so it is not an evidence label and
 *          takes no label colour.
 * Exports: KindChip
 * Used by: components/app-home/LibraryTableRow.tsx, components/app-home/LibraryCard.tsx
 */
import type { Archetype } from "@stamp/schema";
import type { ReactElement } from "react";
import { ARCHETYPE_LABEL } from "@/utils/archetype";

export function KindChip({ archetype }: { archetype: Archetype }): ReactElement {
  return (
    <span className="inline-flex items-center rounded-full border border-rule px-2.5 py-0.5 text-small whitespace-nowrap text-ink">
      {ARCHETYPE_LABEL[archetype]}
    </span>
  );
}
