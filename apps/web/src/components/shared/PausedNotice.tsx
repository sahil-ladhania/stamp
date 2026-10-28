/**
 * File: PausedNotice.tsx
 * Purpose: Notice shown when the daily run cap is reached: live research is off, but guides Stamp already has still open.
 * Exports: PausedNotice
 * Used by: components/shared/StartRunSearch.tsx
 */
import type { ReactElement } from "react";
import { CirclePause } from "lucide-react";

/** Ink border, not red or amber: this is a service state, not a verdict or an unconfirmed claim. */
export function PausedNotice(): ReactElement {
  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-md border border-ink bg-card p-4"
    >
      <CirclePause aria-hidden className="mt-0.5 size-5 shrink-0 text-ink" />
      <div className="flex flex-col gap-1">
        <p className="text-card-title text-ink">Live generation paused</p>
        <p className="text-body text-ink-muted">
          Stamp cannot research new apps right now. Guides it has already
          researched still open.
        </p>
      </div>
    </div>
  );
}
