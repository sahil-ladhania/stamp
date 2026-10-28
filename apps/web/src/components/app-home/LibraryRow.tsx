/**
 * File: LibraryRow.tsx
 * Purpose: One library guide as a row: difficulty first, then app and kind of hard, what that kind means and the as-of date.
 * Exports: LibraryRow
 * Used by: components/app-home/LibraryList.tsx
 */
import type { GuideSummary } from "@stamp/schema";
import type { ReactElement } from "react";
import { Link } from "react-router";
import { AppIcon } from "@/components/shared/AppIcon";
import { DifficultyDots } from "@/components/shared/DifficultyDots";
import { ARCHETYPE_BLURB, ARCHETYPE_LABEL } from "@/utils/archetype";
import { formatAsOf } from "@/utils/format-date";

/** From 1024px the row is four columns, so difficulty lines up down the left edge for scanning. */
export function LibraryRow({ guide }: { guide: GuideSummary }): ReactElement {
  return (
    <Link
      to={`/g/${guide.slug}`}
      className="grid gap-2 rounded-md border border-rule bg-card p-4 transition-colors hover:border-ink-muted desktop:grid-cols-[7rem_11rem_1fr_7.5rem] desktop:items-center desktop:gap-4"
    >
      <DifficultyDots score={guide.difficulty} hasValue />
      <div className="flex flex-col">
        <span className="flex items-center gap-2 text-card-title text-ink">
          <AppIcon slug={guide.slug} className="text-ink-muted" />
          {guide.appName}
        </span>
        <span className="text-data text-ink-muted">
          {ARCHETYPE_LABEL[guide.archetype]}
        </span>
      </div>
      <p className="text-body text-ink-muted">
        {ARCHETYPE_BLURB[guide.archetype]}
      </p>
      <p className="text-small text-ink-muted desktop:text-right">
        As of {formatAsOf(guide.asOf)}
      </p>
    </Link>
  );
}
