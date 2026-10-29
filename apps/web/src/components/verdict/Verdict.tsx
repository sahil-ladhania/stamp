/**
 * File: Verdict.tsx
 * Purpose: The one summary of a guide, shared by the Landing sample, the hero poster and the Guide page: the app, the stamp mark,
 *          then difficulty, kind of hard, and the claim rows. Values are ink; the label of each claim sits beside it. Each row
 *          links to the section that holds the full version, so no fact is told twice.
 * Exports: Verdict
 * Used by: pages/GuidePage.tsx (via GuideView), components/landing/VerdictSection.tsx, components/landing/HeroPoster.tsx
 */
import type { ReactElement } from "react";
import { AppIdentity } from "@/components/shared/AppIdentity";
import { cn } from "@/lib/utils";
import type { Guide } from "@/types/guide-model";
import { getVerdictRows, type VerdictRow as VerdictRowData, type VerdictRowId } from "@/utils/verdict";
import { DifficultyRow } from "./DifficultyRow";
import { KindRow } from "./KindRow";
import { StampMark } from "./StampMark";
import { VerdictRow } from "./VerdictRow";

type VerdictProps = {
  guide: Guide;
  /**
   * `compact` is the hero poster and the run result: first test, production and top blocker. `full` shows every row, with its own
   * difficulty row (the Landing sample). `guide` leaves that row out: the stamp mark holds the score and "Why this score" joins the kind row.
   */
  variant?: "full" | "compact" | "guide";
  /** False leaves out the app name, for a page that already shows it. The header keeps the stamp mark. */
  hasIdentity?: boolean;
  /** Where a row's full version lives. Return null for a row with no link. */
  detailHref?: (row: VerdictRowData) => string | null;
  /** The row to highlight, when a question beside the card points at it. */
  highlighted?: VerdictRowId | null;
  className?: string;
};

const COMPACT_ROWS: readonly VerdictRowId[] = ["firstTest", "production", "topBlocker"];

export function Verdict({ guide, variant = "full", hasIdentity = true, detailHref, highlighted = null, className }: VerdictProps): ReactElement {
  const rows = getVerdictRows(guide).filter((row) => variant !== "compact" || COMPACT_ROWS.includes(row.id));

  return (
    <article aria-label={`Verdict for ${guide.appName}`} className={cn("rounded-md border border-ink bg-card", className)}>
      <header
        className={cn(
          "flex items-start justify-between gap-4 border-b border-rule",
          hasIdentity ? "p-4 tablet:p-6" : "px-4 py-3 tablet:px-6",
        )}
      >
        {hasIdentity ? (
          <div className="flex min-w-0 flex-col gap-1">
            <AppIdentity name={guide.appName} slug={guide.slug} size="md" />
            <p className="text-small text-ink-muted">Verdict</p>
          </div>
        ) : (
          <p className="pt-1 text-small text-ink-muted">Verdict</p>
        )}
        <StampMark score={guide.difficulty.score} />
      </header>
      <dl className="flex flex-col divide-y divide-rule">
        {variant === "full" && <DifficultyRow difficulty={guide.difficulty} isHighlighted={highlighted === "difficulty"} />}
        {variant !== "compact" && (
          <KindRow
            archetype={guide.archetype}
            difficulty={variant === "guide" ? guide.difficulty : undefined}
            isHighlighted={highlighted === "kind"}
          />
        )}
        {rows.map((row) => (
          <VerdictRow
            key={row.id}
            row={row}
            href={detailHref?.(row) ?? null}
            isHighlighted={highlighted === row.id}
          />
        ))}
      </dl>
    </article>
  );
}
