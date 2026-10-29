/**
 * File: EventRow.tsx
 * Purpose: One event row of a stage group: a search (the query in mono), a page read (a source chip, never a raw address), a checked
 *          quote, or the retry that sends the run back to Search. New rows fade in; under reduced motion they appear at once.
 * Exports: EventRow
 * Used by: components/run/StageGroup.tsx, components/landing/StepVisualTrace.tsx
 */
import type { ReactElement } from "react";
import { FileText, RotateCcw, Search } from "lucide-react";
import { SourceChip } from "@/components/shared/SourceChip";
import { sourceTitle } from "@/utils/map-source";
import type { GroupItem } from "@/utils/run-groups";
import { QuoteRow } from "./QuoteRow";

const ROW = "flex flex-wrap items-center gap-x-3 gap-y-1";

function Row({ item }: { item: GroupItem }): ReactElement {
  switch (item.type) {
    case "search":
      return (
        <div className={ROW}>
          <Search aria-hidden className="size-4 shrink-0 text-ink-muted" />
          <code className="min-w-0 font-mono text-data break-words text-ink">{item.query}</code>
        </div>
      );
    case "page":
      return (
        <div className={ROW}>
          <FileText aria-hidden className="size-4 shrink-0 text-ink-muted" />
          <SourceChip source={{ url: item.url, title: sourceTitle(item.url), tier: item.tier }} />
        </div>
      );
    case "retry":
      return (
        <div className={ROW}>
          <RotateCcw aria-hidden className="size-4 shrink-0 text-ink" />
          <span className="text-body font-semibold text-ink">Searching again.</span>
          <span className="text-body text-ink-muted">A steps or scopes section had no matched quote.</span>
        </div>
      );
    case "kept":
    case "downgraded":
      return <QuoteRow item={item} />;
  }
}

export function EventRow({ item }: { item: GroupItem }): ReactElement {
  return (
    <li className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-150">
      <Row item={item} />
    </li>
  );
}
