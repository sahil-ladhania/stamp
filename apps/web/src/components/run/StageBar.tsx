/**
 * File: StageBar.tsx
 * Purpose: The nine stages as one horizontal bar: a check for done, a pulse for running, a dash for not run. Each segment is a button
 *          that opens its group below, with the stage name and state on hover and focus. It scrolls sideways on a phone and keeps the
 *          running segment in view.
 * Exports: StageBar
 * Used by: components/run/TraceTimeline.tsx
 */
import { useEffect, useRef, type ReactElement } from "react";
import { Check, Minus, X } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";
import { formatSeconds } from "@/utils/format-duration";
import { STAGE_KIND_LABEL } from "@/utils/run-stages";
import type { StageStatus, StageView } from "@/utils/run-view";

const SEGMENT: Record<StageStatus, string> = {
  done: "border-ink-muted/50 bg-ink-muted/15 text-ink",
  running: "border-ink bg-paper text-ink",
  waiting: "border-rule bg-card text-ink-muted",
  stopped: "border-dashed border-ink bg-card text-ink",
  "not-run": "border-dashed border-rule bg-card text-ink-muted",
};

function statusWord(stage: StageView): string {
  switch (stage.status) {
    case "done":
      return stage.durationMs === null ? "Done" : `Done in ${formatSeconds(stage.durationMs)}`;
    case "running":
      return "Running";
    case "waiting":
      return "Waiting";
    case "stopped":
      return "Stopped";
    case "not-run":
      return "Not run";
  }
}

function Mark({ status }: { status: StageStatus }): ReactElement | null {
  if (status === "done") return <Check aria-hidden className="size-4" />;
  if (status === "stopped") return <X aria-hidden className="size-4" />;
  if (status === "not-run") return <Minus aria-hidden className="size-4" />;
  if (status === "running") return <span aria-hidden className="size-2.5 rounded-full bg-ink motion-safe:animate-pulse" />;
  return null;
}

type StageBarProps = { stages: readonly StageView[]; onSelect: (stage: number) => void };

export function StageBar({ stages, onSelect }: StageBarProps): ReactElement {
  const listRef = useRef<HTMLOListElement>(null);
  const isReduced = useReducedMotion();
  const running = stages.find((stage) => stage.status === "running")?.stage ?? null;

  // Scrolls the bar itself, never the page: the page is following the trace.
  useEffect(() => {
    const list = listRef.current;
    const item = running === null ? null : list?.querySelector<HTMLElement>(`[data-stage="${running}"]`);
    if (!list || !item) return;
    list.scrollTo({ left: item.offsetLeft - (list.clientWidth - item.clientWidth) / 2, behavior: isReduced ? "auto" : "smooth" });
  }, [running, isReduced]);

  return (
    <ol ref={listRef} aria-label="Run stages" className="relative flex gap-1 overflow-x-auto pb-1">
      {stages.map((stage) => {
        const detail = `${STAGE_KIND_LABEL[stage.kind]} · ${statusWord(stage)}`;
        return (
          <li key={stage.stage} data-stage={stage.stage} className="min-w-11 flex-1">
            <Tooltip
              content={
                <>
                  <span className="font-semibold">{stage.name}</span>
                  <br />
                  {detail}
                </>
              }
            >
              <button
                type="button"
                aria-label={`${stage.name}. ${detail}`}
                aria-current={stage.status === "running" ? "step" : undefined}
                onClick={() => onSelect(stage.stage)}
                className={cn(
                  "flex h-9 w-full cursor-pointer items-center justify-center rounded-md border motion-safe:transition-colors motion-safe:duration-200",
                  SEGMENT[stage.status],
                )}
              >
                <Mark status={stage.status} />
              </button>
            </Tooltip>
          </li>
        );
      })}
    </ol>
  );
}
