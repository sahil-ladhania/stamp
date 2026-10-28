/**
 * File: VerdictRow.tsx
 * Purpose: One row of the verdict: a label, the value in ink (two lines at most), the label of its claim, and a link to the
 *          section that holds the full version. An unknown value is a muted "Not found" with the Uncertain label.
 * Exports: VerdictRow
 * Used by: components/verdict/Verdict.tsx
 */
import type { ReactElement, ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { ClaimEvidence } from "@/components/evidence/ClaimEvidence";
import { UnknownValue } from "@/components/shared/UnknownValue";
import { cn } from "@/lib/utils";
import type { VerdictRow as VerdictRowData } from "@/utils/verdict";
import { isUnknownClaim } from "@/utils/is-unknown-claim";

type VerdictRowProps = {
  row: VerdictRowData;
  /** Where the full version lives. Without one the row has no link. */
  href: string | null;
  isHighlighted: boolean;
};

/** The row frame for any value: the label on the left, the answer and the link on the right. */
export function VerdictRowFrame({
  id,
  label,
  children,
  href,
  linkLabel,
  isHighlighted,
}: {
  id: string;
  label: string;
  children: ReactNode;
  href: string | null;
  linkLabel: string;
  isHighlighted: boolean;
}): ReactElement {
  return (
    <div
      id={id}
      className={cn(
        "grid gap-1 px-4 py-3 motion-safe:transition-colors tablet:grid-cols-[8rem_1fr_auto] tablet:items-start tablet:gap-4",
        isHighlighted && "bg-paper",
      )}
    >
      <dt className="text-small text-ink-muted">{label}</dt>
      <dd className="flex min-w-0 flex-wrap items-start gap-x-3 gap-y-1">{children}</dd>
      {href ? (
        <Link
          to={href}
          aria-label={linkLabel}
          className="hidden size-6 items-center justify-center text-ink-muted hover:text-ink tablet:inline-flex"
        >
          <ArrowRight aria-hidden className="size-4" />
        </Link>
      ) : (
        <span aria-hidden className="hidden size-6 tablet:block" />
      )}
    </div>
  );
}

export function VerdictRow({ row, href, isHighlighted }: VerdictRowProps): ReactElement {
  const { claim } = row;
  const isUnknown = claim === null || isUnknownClaim(claim);

  return (
    <VerdictRowFrame
      id={`verdict-${row.id}`}
      label={row.label}
      href={href}
      linkLabel={`See ${row.label.toLowerCase()} in detail`}
      isHighlighted={isHighlighted}
    >
      {isUnknown ? (
        <UnknownValue text={claim === null ? "Not researched" : "Not found"} claim={claim ?? undefined} />
      ) : (
        <>
          <span className="line-clamp-2 min-w-0 flex-1 basis-48 text-body text-ink">{row.value}</span>
          {claim && <ClaimEvidence claim={claim} />}
        </>
      )}
    </VerdictRowFrame>
  );
}
