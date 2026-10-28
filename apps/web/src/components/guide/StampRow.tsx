/**
 * File: StampRow.tsx
 * Purpose: One labelled row inside a stamp's definition list: a quiet label and the answer beside it.
 * Exports: StampRow
 * Used by: components/guide/VerdictStamp.tsx, components/guide/ResultStamp.tsx
 */
import type { ReactElement, ReactNode } from "react";

type StampRowProps = { label: string; children: ReactNode };

/** Render inside a `<dl>`. The answer takes the first column; an optional trailing item sits right. */
export function StampRow({ label, children }: StampRowProps): ReactElement {
  return (
    <div className="grid gap-1 py-3 tablet:grid-cols-[7.5rem_1fr] tablet:gap-4">
      <dt className="text-small text-ink-muted">{label}</dt>
      <dd className="grid grid-cols-[1fr_auto] items-start gap-3">
        {children}
      </dd>
    </div>
  );
}
