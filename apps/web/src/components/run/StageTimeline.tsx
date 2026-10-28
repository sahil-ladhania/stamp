/**
 * File: StageTimeline.tsx
 * Purpose: The Progress card: all nine stages, in order, each with its state.
 * Exports: StageTimeline
 * Used by: components/run/RunScreen.tsx
 */
import type { ReactElement } from "react";
import { cn } from "@/lib/utils";
import type { StageView } from "@/utils/run-view";
import { StageItem } from "./StageItem";

type StageTimelineProps = {
  stages: readonly StageView[];
  className?: string;
};

export function StageTimeline({
  stages,
  className,
}: StageTimelineProps): ReactElement {
  return (
    <section
      aria-labelledby="progress-heading"
      className={cn(
        "flex flex-col gap-1 rounded-md border border-rule bg-card p-4",
        className,
      )}
    >
      <h2 id="progress-heading" className="text-card-title text-ink">
        Progress
      </h2>
      <ol className="flex flex-col divide-y divide-rule">
        {stages.map((stage) => (
          <StageItem key={stage.stage} stage={stage} />
        ))}
      </ol>
    </section>
  );
}
