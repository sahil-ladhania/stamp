/**
 * File: RunResultCard.tsx
 * Purpose: The payoff when a run ends: the shared Verdict in compact form (the stamp presses once), what the claims came to in the same
 *          counts and words the Guide uses, and the button that opens the guide. A partial run adds Retry run. The button shows at once;
 *          the verdict follows when the saved guide loads, and without it the card still says how long the run took.
 * Exports: RunResultCard
 * Used by: components/run/RunScreen.tsx
 */
import type { RunSnapshot } from "@stamp/schema";
import type { ReactElement } from "react";
import { LabelBar } from "@/components/shared/LabelBar";
import { Verdict } from "@/components/verdict/Verdict";
import { useRunClock } from "@/hooks/useRunClock";
import type { Guide } from "@/types/guide-model";
import { countClaims, describeClaimCounts } from "@/utils/claim-counts";
import { RunActions } from "./RunActions";
import { getResultActions, getResultCopy } from "./run-copy";

type RunResultCardProps = {
  slug: string;
  isPartial: boolean;
  guide: Guide | null;
  isGuideLoading: boolean;
  snapshot: RunSnapshot | null;
  /** The claim ids of the run's downgrade events. Empty when the trace is gone. */
  downgradedIds: readonly string[];
  hasTrace: boolean;
  isPending: boolean;
  onNewRun: () => void;
};

export function RunResultCard({
  slug,
  isPartial,
  guide,
  isGuideLoading,
  snapshot,
  downgradedIds,
  hasTrace,
  isPending,
  onNewRun,
}: RunResultCardProps): ReactElement {
  const elapsedMs = useRunClock(snapshot, false);
  const copy = getResultCopy({ isPartial, isSummaryOnly: !hasTrace, elapsedMs });
  const counts = guide ? describeClaimCounts(countClaims(guide.claims, downgradedIds), { hasBreakdown: hasTrace }) : null;

  return (
    <section aria-labelledby="run-result-heading" className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 id="run-result-heading" className="text-section text-ink">
          {copy.heading}
        </h2>
        <p className="max-w-prose text-body text-ink-muted">{copy.lead}</p>
      </div>
      <div className="grid gap-6 desktop:grid-cols-12 desktop:items-start">
        <div className="desktop:col-span-7">
          {guide ? (
            <Verdict guide={guide} variant="compact" hasIdentity={false} />
          ) : (
            isGuideLoading && <div aria-hidden className="h-56 rounded-md border border-rule bg-card" />
          )}
        </div>
        <div className="flex flex-col gap-4 desktop:col-span-5">
          {guide && counts && (
            <>
              <p className="text-body font-semibold text-ink">{counts}</p>
              <LabelBar claims={guide.claims} />
            </>
          )}
          <RunActions actions={getResultActions(slug, isPartial)} isPending={isPending} onNewRun={onNewRun} onReconnect={() => undefined} />
        </div>
      </div>
    </section>
  );
}
