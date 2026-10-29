/**
 * File: TraceTimeline.tsx
 * Purpose: The merged timeline, in place of the old Progress and Trace columns: the stage bar, then the trace grouped by stage in time
 *          order. The running group is open and a done group is closed; a click on a group, or on its segment in the bar, overrides that.
 *          It is part of the page, with no inner scroll box.
 * Exports: TraceTimeline
 * Used by: components/run/RunScreen.tsx
 */
import { useState, type ReactElement } from "react";
import { Accordion } from "@/components/ui/accordion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { StageGroup as StageGroupData } from "@/utils/run-groups";
import { StageBar } from "./StageBar";
import { StageGroup } from "./StageGroup";

type TraceTimelineProps = {
  groups: readonly StageGroupData[];
  /** The run is live: the trace is "live" and the first event may not have come yet. */
  isLive: boolean;
  hasEvents: boolean;
};

export function TraceTimeline({ groups, isLive, hasEvents }: TraceTimelineProps): ReactElement {
  // What the reader opened or closed. A group they never touched follows its state: open while running, closed after.
  const [overrides, setOverrides] = useState<Record<number, boolean>>({});
  const isReduced = useReducedMotion();
  const isOpen = (group: StageGroupData): boolean =>
    group.items.length > 0 && (overrides[group.stage] ?? group.status === "running");
  const openValues = groups.filter(isOpen).map((group) => String(group.stage));

  function handleChange(next: string[]): void {
    const changed = [...next.filter((v) => !openValues.includes(v)), ...openValues.filter((v) => !next.includes(v))];
    setOverrides((current) => ({
      ...current,
      ...Object.fromEntries(changed.map((value) => [Number(value), next.includes(value)])),
    }));
  }

  function select(stage: number): void {
    setOverrides((current) => ({ ...current, [stage]: true }));
    document.getElementById(`stage-group-${stage}`)?.scrollIntoView({ block: "start", behavior: isReduced ? "auto" : "smooth" });
  }

  return (
    <section aria-labelledby="trace-heading" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id="trace-heading" className="text-section text-ink">
          {isLive ? "Live trace" : "How Stamp got here"}
        </h2>
        <p className="text-body text-ink-muted">
          {isLive
            ? "Every search, page read and quote check, as it happens."
            : "Every search, page read and quote check behind the guide."}
        </p>
      </div>
      <StageBar stages={groups} onSelect={select} />
      {hasEvents ? (
        <Accordion type="multiple" value={openValues} onValueChange={handleChange} asChild>
          <ol className="flex flex-col border-y border-rule">
            {groups.map((group) => (
              <StageGroup key={group.stage} group={group} />
            ))}
          </ol>
        </Accordion>
      ) : (
        <p className="text-small text-ink-muted">Waiting for the first event.</p>
      )}
    </section>
  );
}
