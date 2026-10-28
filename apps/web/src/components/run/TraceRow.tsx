/**
 * File: TraceRow.tsx
 * Purpose: One line of the trace: a search, a page read, a quote that matched, a claim downgraded, or a stage marker.
 * Exports: TraceRow
 * Used by: components/run/TracePanel.tsx
 */
import type { ReactElement, ReactNode } from "react";
import { FileText, Quote, Search, type LucideIcon } from "lucide-react";
import { EvidenceLabel } from "@/components/shared/EvidenceLabel";
import { SourceLink } from "@/components/shared/SourceLink";
import { formatSeconds } from "@/utils/format-duration";
import type { TraceItem } from "@/utils/run-view";
import { TIER_LABEL } from "@/utils/source-tier";

const ICON: Partial<Record<TraceItem["type"], LucideIcon>> = {
  search: Search,
  page: FileText,
  kept: Quote,
  downgraded: Quote,
};

function UrlLink({ url }: { url: string }): ReactElement {
  return (
    <SourceLink source={{ url, title: url }} className="text-data break-all" />
  );
}

/** A plain function, not a component: it picks the wording and the extras for each kind of row. */
function renderContent(item: TraceItem): ReactNode {
  switch (item.type) {
    case "stage-started":
      return <p className="text-small text-ink-muted">{item.name} started</p>;
    case "stage-done":
      return (
        <p className="text-small text-ink-muted">
          {item.name} done in {formatSeconds(item.durationMs)}
        </p>
      );
    case "search":
      return (
        <p className="text-small text-ink-muted">
          Searched{" "}
          <code className="text-data break-words text-ink">{item.query}</code>
        </p>
      );
    case "page":
      return (
        <>
          <p className="text-small text-ink-muted">
            Read page · {TIER_LABEL[item.tier]}
          </p>
          <UrlLink url={item.url} />
        </>
      );
    case "kept":
      return (
        <>
          <p className="flex flex-wrap items-center gap-2 text-small text-ink-muted">
            Quote matched{" "}
            <code className="text-data text-ink">{item.claimId}</code>
            <EvidenceLabel kind="sourced" />
          </p>
          <UrlLink url={item.url} />
        </>
      );
    case "downgraded":
      return (
        <>
          <p className="flex flex-wrap items-center gap-2 text-small text-ink-muted">
            Downgraded to Uncertain{" "}
            <code className="text-data text-ink">{item.claimId}</code>
            <EvidenceLabel kind="uncertain" />
          </p>
          <p className="text-small text-ink-muted">{item.reason}</p>
        </>
      );
  }
}

export function TraceRow({ item }: { item: TraceItem }): ReactElement {
  const Icon = ICON[item.type];

  return (
    <li className="grid grid-cols-[1rem_1fr] gap-3 py-2">
      {Icon ? (
        <Icon aria-hidden className="mt-0.5 size-4 text-ink-muted" />
      ) : (
        <span aria-hidden />
      )}
      <div className="flex flex-col gap-1">{renderContent(item)}</div>
    </li>
  );
}
