/**
 * File: LibraryTimeCell.tsx
 * Purpose: One duration in the library: the stated time in mono with the label of its claim, a quiet bar while it loads, or
 *          "Not stated" with the Uncertain label when the guide states none.
 * Exports: LibraryTimeCell
 * Used by: components/app-home/LibraryTableRow.tsx, components/app-home/LibraryCard.tsx
 */
import type { ReactElement } from "react";
import { EvidenceLabel } from "@/components/shared/EvidenceLabel";
import { UnknownValue } from "@/components/shared/UnknownValue";
import type { LibraryTime } from "@/utils/library-times";

type LibraryTimeCellProps = { time: LibraryTime | null; isLoading: boolean };

export function LibraryTimeCell({ time, isLoading }: LibraryTimeCellProps): ReactElement {
  if (isLoading) {
    return (
      <span className="block h-4 w-16 rounded-sm bg-rule">
        <span className="sr-only">Loading</span>
      </span>
    );
  }
  if (!time) return <UnknownValue text="Not stated" className="text-small" />;
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
      <span className="font-mono text-data text-ink">{time.duration}</span>
      <EvidenceLabel kind={time.label} size="sm" />
    </span>
  );
}
