/**
 * File: SourceChip.tsx
 * Purpose: A source as one compact chip: an initial tile, the domain, a short title, the tier as a tag and an external-link
 *          icon. It never wraps; long text is cut inside the chip. The full URL is in the tooltip and the accessible name.
 *          No favicon is fetched, which would tell a third party about every domain.
 * Exports: SourceChip
 * Used by: components/evidence/EvidencePanel.tsx, components/guide/SourcesTable.tsx, components/guide/ConflictCard.tsx
 */
import type { ReactElement } from "react";
import { ExternalLink } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Source } from "@/types/guide-model";
import { sourceDomain, sourceInitial, sourceShortTitle } from "@/utils/source-display";
import { TIER_SHORT_LABEL } from "@/utils/source-tier";

export function SourceChip({ source, className }: { source: Source; className?: string }): ReactElement {
  const domain = sourceDomain(source.url);
  const title = sourceShortTitle(source.url);
  const tier = TIER_SHORT_LABEL[source.tier];

  return (
    <Tooltip content={source.url}>
      <a
        href={source.url}
        target="_blank"
        rel="noreferrer"
        aria-label={`${domain}${title ? `, ${title}` : ""}. ${tier} source. ${source.url}. Opens in a new tab`}
        className={cn(
          "inline-flex max-w-full min-w-0 items-center gap-2 rounded-md border border-rule bg-card py-1 pr-2 pl-1 text-small text-ink transition-colors hover:border-ink-muted",
          className,
        )}
      >
        <span
          aria-hidden
          className="inline-flex size-5 shrink-0 items-center justify-center rounded-sm border border-rule bg-paper text-[0.6875rem] font-semibold text-ink-muted"
        >
          {sourceInitial(source.url)}
        </span>
        <span className="min-w-0 truncate">
          <span className="font-medium">{domain}</span>
          {title && <span className="text-ink-muted"> {title}</span>}
        </span>
        <span className="shrink-0 rounded-sm border border-rule px-1.5 text-[0.6875rem] leading-5 text-ink-muted">{tier}</span>
        <ExternalLink aria-hidden className="size-3.5 shrink-0 text-ink-muted" />
      </a>
    </Tooltip>
  );
}
