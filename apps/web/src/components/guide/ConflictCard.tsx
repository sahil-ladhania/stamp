/**
 * File: ConflictCard.tsx
 * Purpose: Two sources that disagree, shown side by side: each claim with its label and source,
 *          which one Stamp trusts, and why.
 * Exports: ConflictCard
 * Used by: components/verify/ConflictsSection.tsx, components/guide/GuideConflicts.tsx
 */
import { useId, type ReactElement } from "react";
import { AppIcon } from "@/components/shared/AppIcon";
import { cn } from "@/lib/utils";
import { findLibrarySlug } from "@/mocks/guides";
import type { Conflict } from "@/mocks/types";
import { ClaimEvidence } from "./ClaimEvidence";

type ConflictCardProps = {
  conflict: Conflict;
  /** Prefixes the heading when the card is shown outside its own guide. */
  appName?: string;
};

/** The trusted claim gets a darker border and says so in words, so colour is not the only cue. */
export function ConflictCard({
  conflict,
  appName,
}: ConflictCardProps): ReactElement {
  const headingId = useId();
  const appSlug = appName ? findLibrarySlug(appName) : null;

  return (
    <article
      aria-labelledby={headingId}
      className="flex flex-col gap-4 rounded-md border border-rule bg-card p-card"
    >
      <h3
        id={headingId}
        className="flex items-center gap-2 text-card-title text-ink"
      >
        {appSlug && (
          <AppIcon slug={appSlug} className="text-ink-muted" />
        )}
        <span>
          {appName ? `${appName}: ${conflict.topic}` : conflict.topic}
        </span>
      </h3>
      <ul className="flex flex-col gap-3">
        {conflict.options.map((option) => (
          <li
            key={option.claim.id}
            className={cn(
              "flex flex-col gap-2 rounded-md border p-3",
              option.isTrusted ? "border-ink" : "border-rule",
            )}
          >
            <p className="text-body text-ink">{option.claim.text}</p>
            <ClaimEvidence claim={option.claim} />
            {option.isTrusted && (
              <p className="text-small font-semibold text-ink">
                Stamp trusts this one
              </p>
            )}
          </li>
        ))}
      </ul>
      <p className="text-small text-ink-muted">{conflict.reason}</p>
    </article>
  );
}
