/**
 * File: SourcesTable.tsx
 * Purpose: Every source the guide cites: the chip (which opens the page in a new tab), its tier, and how many claims use it. Official
 *          first, then third party, then forum; the list arrives in that order. A table from the tablet width up, a stack on a phone.
 * Exports: SourcesTable
 * Used by: components/guide/SourcesSection.tsx
 */
import type { ReactElement } from "react";
import { SourceChip } from "@/components/shared/SourceChip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Source } from "@/types/guide-model";
import { pluralize } from "@/utils/plural";
import { TIER_LABEL } from "@/utils/source-tier";

function usedByText(source: Source): string {
  return source.usedBy ? pluralize(source.usedBy, "claim") : "No claims";
}

export function SourcesTable({ sources }: { sources: readonly Source[] }): ReactElement {
  return (
    <>
      <div className="hidden tablet:block">
        <SourcesWide sources={sources} />
      </div>
      <ul className="flex flex-col divide-y divide-rule border-y border-rule tablet:hidden">
        {sources.map((source) => (
          <li key={source.url} className="flex flex-col items-start gap-1 py-3">
            <SourceChip source={source} hasTier={false} />
            <p className="text-small text-ink-muted">{`${TIER_LABEL[source.tier]} · ${usedByText(source)}`}</p>
          </li>
        ))}
      </ul>
    </>
  );
}

function SourcesWide({ sources }: { sources: readonly Source[] }): ReactElement {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="pl-0">Source</TableHead>
          <TableHead>Tier</TableHead>
          <TableHead className="pr-0">Used by</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sources.map((source) => (
          <TableRow key={source.url} className="align-middle">
            <TableCell className="w-1/2 pl-0">
              <SourceChip source={source} hasTier={false} />
            </TableCell>
            <TableCell className="text-small whitespace-nowrap text-ink-muted">{TIER_LABEL[source.tier]}</TableCell>
            <TableCell className="pr-0 text-small whitespace-nowrap text-ink-muted">
              {usedByText(source)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
