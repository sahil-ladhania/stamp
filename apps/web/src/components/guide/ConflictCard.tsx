/**
 * File: ConflictCard.tsx
 * Purpose: Two sources that disagree, shown side by side: each source's text and link, which one Stamp trusts,
 *          and why. On a guide the reason is a claim with its own evidence; on an editorial example it is plain text.
 * Exports: ConflictCard
 * Used by: components/guide/GuideConflicts.tsx, components/verify/ConflictsSection.tsx
 */
import { useId, type ReactElement } from "react";
import { AppIcon } from "@/components/shared/AppIcon";
import { SourceLink } from "@/components/shared/SourceLink";
import { cn } from "@/lib/utils";
import type { Conflict } from "@/types/guide-model";
import { TIER_LABEL } from "@/utils/source-tier";
import { ClaimEvidence } from "./ClaimEvidence";

type ConflictCardProps = {
  conflict: Conflict;
  /** Prefixes the heading when the card is shown outside its own guide. */
  appName?: string;
  /** False for an editorial example, whose reason is Stamp's wording and has no label to show. */
  hasReasonEvidence?: boolean;
};

/** The trusted source gets a darker border and says so in words, so colour is not the only cue. */
export function ConflictCard({
  conflict,
  appName,
  hasReasonEvidence = true,
}: ConflictCardProps): ReactElement {
  const headingId = useId();

  return (
    <article
      aria-labelledby={headingId}
      className="flex flex-col gap-4 rounded-md border border-rule bg-card p-card"
    >
      <h3
        id={headingId}
        className="flex items-center gap-2 text-card-title text-ink"
      >
        {appName && (
          <AppIcon slug={appName.toLowerCase()} className="text-ink-muted" />
        )}
        <span>
          {appName ? `${appName}: ${conflict.topic}` : conflict.topic}
        </span>
      </h3>
      <ul className="flex flex-col gap-3">
        {conflict.options.map(({ source, isTrusted }) => (
          <li
            key={source.url}
            className={cn(
              "flex flex-col gap-2 rounded-md border p-3",
              isTrusted ? "border-ink" : "border-rule",
            )}
          >
            <p className="text-body text-ink">{source.quote ?? source.title}</p>
            <span className="flex flex-wrap items-center gap-2">
              <SourceLink source={source} />
              <span className="text-data text-ink-muted">
                {TIER_LABEL[source.tier]}
              </span>
            </span>
            {isTrusted && (
              <p className="text-small font-semibold text-ink">
                Stamp trusts this one
              </p>
            )}
          </li>
        ))}
      </ul>
      <p className="text-body text-ink-muted">{conflict.reason.text}</p>
      {hasReasonEvidence && <ClaimEvidence claim={conflict.reason} />}
    </article>
  );
}
