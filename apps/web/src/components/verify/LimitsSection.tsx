/**
 * File: LimitsSection.tsx
 * Purpose: How we verify section 5: the budgets on a live run, what happens when one is hit, and when Stamp cannot finish.
 * Exports: LimitsSection
 * Used by: pages/HowWeVerifyPage.tsx
 */
import type { ReactElement } from "react";
import { RUN_LIMITS, UNFINISHED_CASES } from "@/content/run-limits";
import { PageSection } from "@/components/shared/PageSection";

export function LimitsSection(): ReactElement {
  return (
    <PageSection
      id="limits"
      title="Run limits"
      description="A live run has fixed budgets so it cannot hang or run up costs. Guides Stamp already has keep working when a limit is hit."
    >
      <dl className="flex flex-col divide-y divide-rule border-y border-rule">
        {RUN_LIMITS.map((limit) => (
          <div
            key={limit.name}
            className="grid gap-1 py-4 tablet:grid-cols-[9rem_11rem_1fr] tablet:gap-4"
          >
            <dt className="text-body font-semibold text-ink">{limit.name}</dt>
            <dd className="text-data text-ink">{limit.value}</dd>
            <dd className="text-body text-ink-muted">{limit.effect}</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-col gap-3">
        <h3 className="text-card-title text-ink">If Stamp cannot finish</h3>
        <ul className="flex flex-col divide-y divide-rule border-y border-rule">
          {UNFINISHED_CASES.map((item) => (
            <li
              key={item.situation}
              className="grid gap-1 py-3 tablet:grid-cols-[18rem_1fr] tablet:gap-4"
            >
              <span className="text-body text-ink">{item.situation}</span>
              <span className="text-body text-ink-muted">{item.response}</span>
            </li>
          ))}
        </ul>
      </div>
    </PageSection>
  );
}
