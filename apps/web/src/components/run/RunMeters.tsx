/**
 * File: RunMeters.tsx
 * Purpose: Time and pages used so far against the run budgets, small and inline in the sticky header. Retries show only once one
 *          happens. Every number is counted from events. It owns the clock, so the tick re-renders only these numbers.
 * Exports: RunMeters
 * Used by: components/run/RunScreen.tsx
 */
import type { RunSnapshot } from "@stamp/schema";
import type { ReactElement } from "react";
import { useRunClock } from "@/hooks/useRunClock";
import { formatSeconds } from "@/utils/format-duration";
import { RUN_PAGE_LIMIT, RUN_RETRY_LIMIT, RUN_TIME_LIMIT_MS } from "@/utils/run-budgets";

type RunMetersProps = {
  snapshot: RunSnapshot | null;
  /** While running the numbers tick, so screen readers skip them until the run ends. */
  isRunning: boolean;
  pagesRead: number;
  retries: number;
};

function Meter({ label, value, fraction }: { label: string; value: string; fraction: number }): ReactElement {
  return (
    <div className="flex items-center gap-1.5 tablet:gap-2">
      <dt className="text-small text-ink-muted">{label}</dt>
      <dd className="font-mono text-data text-ink">{value}</dd>
      <span aria-hidden className="hidden h-1 w-12 rounded-full bg-rule tablet:block">
        <span
          className="block h-full rounded-full bg-ink motion-safe:transition-[width] motion-safe:duration-250"
          style={{ width: `${Math.min(100, fraction * 100)}%` }}
        />
      </span>
    </div>
  );
}

export function RunMeters({ snapshot, isRunning, pagesRead, retries }: RunMetersProps): ReactElement {
  const elapsedMs = useRunClock(snapshot, isRunning);
  const wholeSeconds = Math.floor(elapsedMs / 1000) * 1000;

  return (
    <dl aria-hidden={isRunning || undefined} className="flex flex-wrap items-center gap-x-3 gap-y-1 tablet:gap-x-5">
      <Meter
        label="Time"
        value={`${formatSeconds(wholeSeconds)} / ${formatSeconds(RUN_TIME_LIMIT_MS)}`}
        fraction={elapsedMs / RUN_TIME_LIMIT_MS}
      />
      <Meter label="Pages" value={`${pagesRead} / ${RUN_PAGE_LIMIT}`} fraction={pagesRead / RUN_PAGE_LIMIT} />
      {retries > 0 && (
        <Meter label="Retry" value={`${retries} / ${RUN_RETRY_LIMIT}`} fraction={retries / RUN_RETRY_LIMIT} />
      )}
    </dl>
  );
}
