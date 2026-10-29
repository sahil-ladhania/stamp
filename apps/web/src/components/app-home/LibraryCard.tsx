/**
 * File: LibraryCard.tsx
 * Purpose: One library guide as a card, for a phone, where a table does not fit: the same facts as a table row, stacked.
 * Exports: LibraryCard
 * Used by: components/app-home/LibrarySection.tsx
 */
import type { GuideSummary } from "@stamp/schema";
import type { ReactElement } from "react";
import { Link } from "react-router";
import { AppIdentity } from "@/components/shared/AppIdentity";
import { DifficultyDots } from "@/components/shared/DifficultyDots";
import { KindChip } from "@/components/shared/KindChip";
import { isRated } from "@/utils/difficulty-rating";
import { formatAsOf } from "@/utils/format-date";
import type { LibraryTimes } from "@/utils/library-times";
import { LibraryTimeCell } from "./LibraryTimeCell";

type LibraryCardProps = { guide: GuideSummary; times: LibraryTimes | null; isLoadingTimes: boolean };

export function LibraryCard({ guide, times, isLoadingTimes }: LibraryCardProps): ReactElement {
  return (
    <Link
      to={`/g/${guide.slug}`}
      className="flex flex-col gap-3 rounded-md border border-rule bg-card p-4 transition-colors hover:border-ink-muted"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-card-title text-ink">
          <AppIdentity name={guide.appName} slug={guide.slug} size="md" />
        </span>
        <DifficultyDots score={guide.difficulty} hasValue isRated={isRated(guide.archetype)} className="pt-1" />
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <KindChip archetype={guide.archetype} />
        <span className="text-small text-ink-muted">As of {formatAsOf(guide.asOf)}</span>
      </div>
      <dl className="grid grid-cols-2 gap-3 border-t border-rule pt-3">
        <div className="flex flex-col gap-1">
          <dt className="text-small text-ink-muted">First test</dt>
          <dd>
            <LibraryTimeCell time={times?.firstTest ?? null} isLoading={isLoadingTimes} />
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-small text-ink-muted">Production</dt>
          <dd>
            <LibraryTimeCell time={times?.production ?? null} isLoading={isLoadingTimes} />
          </dd>
        </div>
      </dl>
    </Link>
  );
}
