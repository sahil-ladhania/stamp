/**
 * File: BudgetStrip.tsx
 * Purpose: Time, pages and retries used so far against the run budgets. Every number is counted from events.
 * Exports: BudgetStrip
 * Used by: components/run/RunScreen.tsx
 */
import type { ReactElement } from "react";
import { formatSeconds } from "@/utils/format-duration";
import {
  RUN_PAGE_LIMIT,
  RUN_RETRY_LIMIT,
  RUN_TIME_LIMIT_MS,
} from "@/utils/run-budgets";

type BudgetStripProps = {
  elapsedMs: number;
  pagesRead: number;
  retries: number;
  /** While running the numbers tick, so screen readers skip them until the run ends. */
  isRunning: boolean;
};

export function BudgetStrip({
  elapsedMs,
  pagesRead,
  retries,
  isRunning,
}: BudgetStripProps): ReactElement {
  const items = [
    {
      label: "Time",
      value: `${formatSeconds(elapsedMs)} of ${formatSeconds(RUN_TIME_LIMIT_MS)}`,
      fraction: elapsedMs / RUN_TIME_LIMIT_MS,
    },
    {
      label: "Pages read",
      value: `${pagesRead} of ${RUN_PAGE_LIMIT}`,
      fraction: pagesRead / RUN_PAGE_LIMIT,
    },
    {
      label: "Retries",
      value: `${retries} of ${RUN_RETRY_LIMIT}`,
      fraction: retries / RUN_RETRY_LIMIT,
    },
  ];

  return (
    <dl
      aria-hidden={isRunning || undefined}
      className="grid divide-y divide-rule rounded-md border border-rule bg-card tablet:grid-cols-3 tablet:divide-x tablet:divide-y-0"
    >
      {items.map((item) => (
        <div key={item.label} className="flex flex-col gap-2 p-4">
          <dt className="text-small text-ink-muted">{item.label}</dt>
          <dd className="text-data text-ink">{item.value}</dd>
          <span aria-hidden className="block h-1 rounded-full bg-rule">
            <span
              className="block h-full rounded-full bg-ink"
              style={{ width: `${Math.min(100, item.fraction * 100)}%` }}
            />
          </span>
        </div>
      ))}
    </dl>
  );
}
