/**
 * File: TracePanel.tsx
 * Purpose: The Trace card: every search, page read and claim kept or downgraded, newest first, in a scroll box.
 * Exports: TracePanel
 * Used by: components/run/RunScreen.tsx
 */
import type { ReactElement } from "react";
import { cn } from "@/lib/utils";
import type { TraceItem } from "@/utils/run-view";
import { TraceRow } from "./TraceRow";

type TracePanelProps = {
  /** Oldest first, as derived. The panel shows it newest first. */
  trace: readonly TraceItem[];
  className?: string;
};

/**
 * Newest first keeps the latest event in view with no scroll logic. The scroll box is `relative` so the
 * hidden link text inside it is clipped with it. It is a log with live updates off: stage changes are
 * announced by the header instead, so a screen reader is not read every row.
 */
export function TracePanel({
  trace,
  className,
}: TracePanelProps): ReactElement {
  return (
    <section
      aria-labelledby="trace-heading"
      className={cn(
        "flex flex-col gap-3 rounded-md border border-rule bg-card p-4",
        className,
      )}
    >
      <div className="flex flex-col gap-1">
        <h2 id="trace-heading" className="text-card-title text-ink">
          Trace
        </h2>
        <p className="text-small text-ink-muted">
          Every search, every page read and every claim kept or downgraded.
        </p>
      </div>
      <div
        role="log"
        aria-label="Run trace, newest first"
        aria-live="off"
        tabIndex={0}
        className="relative max-h-96 overflow-y-auto desktop:max-h-[30rem]"
      >
        {trace.length === 0 ? (
          <p className="text-small text-ink-muted">
            Waiting for the first event.
          </p>
        ) : (
          <ol className="flex flex-col divide-y divide-rule">
            {[...trace].reverse().map((item) => (
              <TraceRow key={item.id} item={item} />
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
