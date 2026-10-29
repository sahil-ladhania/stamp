/**
 * File: LibraryTable.tsx
 * Purpose: The library as a table from the tablet width up: app, difficulty (with the rule one click away), kind of hard, first
 *          test, production and as-of date. On a phone the same guides are cards.
 * Exports: LibraryTable
 * Used by: components/app-home/LibrarySection.tsx
 */
import type { GuideSummary } from "@stamp/schema";
import type { ReactElement } from "react";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { LibraryTimesBySlug } from "@/hooks/useLibraryTimes";
import { DifficultyColumnHelp } from "./DifficultyColumnHelp";
import { LibraryTableRow } from "./LibraryTableRow";

type LibraryTableProps = {
  guides: readonly GuideSummary[];
  times: LibraryTimesBySlug | null;
  isLoadingTimes: boolean;
};

export function LibraryTable({ guides, times, isLoadingTimes }: LibraryTableProps): ReactElement {
  return (
    <div className="hidden rounded-md border border-rule bg-paper tablet:block">
      <Table className="min-w-[44rem]">
        <caption className="sr-only">Guides in the library</caption>
        <TableHeader>
          <TableRow>
            <TableHead>App</TableHead>
            <TableHead>
              <span className="inline-flex items-center gap-1">
                Difficulty
                <DifficultyColumnHelp />
              </span>
            </TableHead>
            <TableHead>Kind of hard</TableHead>
            <TableHead>First test</TableHead>
            <TableHead>Production</TableHead>
            <TableHead>As of</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {guides.map((guide) => (
            <LibraryTableRow
              key={guide.slug}
              guide={guide}
              times={times?.[guide.slug] ?? null}
              isLoadingTimes={isLoadingTimes}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
