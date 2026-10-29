/**
 * File: LibraryTableRow.tsx
 * Purpose: One library guide as a table row. The whole row is the link: the app name carries it and stretches over the row, so the
 *          row has a hover state and a keyboard focus state, and there is one tab stop per guide.
 * Exports: LibraryTableRow
 * Used by: components/app-home/LibraryTable.tsx
 */
import type { GuideSummary } from "@stamp/schema";
import type { ReactElement } from "react";
import { Link } from "react-router";
import { AppIdentity } from "@/components/shared/AppIdentity";
import { DifficultyDots } from "@/components/shared/DifficultyDots";
import { KindChip } from "@/components/shared/KindChip";
import { TableCell, TableRow } from "@/components/ui/table";
import { isRated } from "@/utils/difficulty-rating";
import { formatAsOf } from "@/utils/format-date";
import type { LibraryTimes } from "@/utils/library-times";
import { LibraryTimeCell } from "./LibraryTimeCell";

type LibraryTableRowProps = {
  guide: GuideSummary;
  /** Null when the guide did not load, or while loading. */
  times: LibraryTimes | null;
  isLoadingTimes: boolean;
};

export function LibraryTableRow({ guide, times, isLoadingTimes }: LibraryTableRowProps): ReactElement {
  return (
    <TableRow className="relative cursor-pointer align-middle transition-colors hover:bg-card has-[a:focus-visible]:bg-card has-[a:focus-visible]:outline-2 has-[a:focus-visible]:-outline-offset-2 has-[a:focus-visible]:outline-sourced">
      <TableCell>
        <Link to={`/g/${guide.slug}`} className="text-card-title text-ink outline-none after:absolute after:inset-0">
          <AppIdentity name={guide.appName} slug={guide.slug} size="md" />
        </Link>
      </TableCell>
      <TableCell>
        <DifficultyDots score={guide.difficulty} hasValue isRated={isRated(guide.archetype)} />
      </TableCell>
      <TableCell>
        <KindChip archetype={guide.archetype} />
      </TableCell>
      <TableCell>
        <LibraryTimeCell time={times?.firstTest ?? null} isLoading={isLoadingTimes} />
      </TableCell>
      <TableCell>
        <LibraryTimeCell time={times?.production ?? null} isLoading={isLoadingTimes} />
      </TableCell>
      <TableCell className="text-small whitespace-nowrap text-ink-muted">{formatAsOf(guide.asOf)}</TableCell>
    </TableRow>
  );
}
