/**
 * File: QuoteRow.tsx
 * Purpose: One checked quote. A match reads as a human name for the claim ("Blocker 1, Fix"), the source chip and the Sourced label on
 *          one row. A downgrade stands out: an ink bar, the Uncertain label and the reason, because the downgrades are the honesty story.
 * Exports: QuoteRow
 * Used by: components/run/EventRow.tsx
 */
import type { ReactElement } from "react";
import { Quote } from "lucide-react";
import { EvidenceLabel } from "@/components/shared/EvidenceLabel";
import { SourceChip } from "@/components/shared/SourceChip";
import { sourceTitle } from "@/utils/map-source";
import { claimPathLabel } from "@/utils/claim-path-label";
import { DOWNGRADE_REASON_LABEL } from "@/utils/downgrade-reason";
import type { GroupItem } from "@/utils/run-groups";

type QuoteItem = Extract<GroupItem, { type: "kept" | "downgraded" }>;

export function QuoteRow({ item }: { item: QuoteItem }): ReactElement {
  const label = claimPathLabel(item.claimId);

  if (item.type === "downgraded") {
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-l-4 border-rule border-l-ink bg-card px-3 py-2">
        <Quote aria-hidden className="size-4 shrink-0 text-ink-muted" />
        <span className="text-body font-semibold text-ink">{label}</span>
        <EvidenceLabel kind="uncertain" size="sm" />
        <span className="text-body text-ink-muted">{DOWNGRADE_REASON_LABEL[item.reason]}</span>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <Quote aria-hidden className="size-4 shrink-0 text-ink-muted" />
      <span className="text-body text-ink">{label}</span>
      {/* The chip is long, so on a phone the label sits before it and the chip gets the next line. */}
      <SourceChip
        source={{ url: item.url, title: sourceTitle(item.url), tier: item.tier ?? "third_party" }}
        hasTier={item.tier !== null}
        className="order-3 tablet:order-2"
      />
      <EvidenceLabel kind="sourced" size="sm" className="order-2 tablet:order-3" />
    </div>
  );
}
