/**
 * File: StageItem.tsx
 * Purpose: One stage in the progress list: a numbered marker, the name, who does the work, and its state in words.
 * Exports: StageItem
 * Used by: components/run/StageTimeline.tsx
 */
import type { ReactElement } from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatSeconds } from "@/utils/format-duration";
import { STAGE_KIND_LABEL } from "@/utils/run-stages";
import type { StageStatus, StageView } from "@/utils/run-view";

// State is shown by fill and outline and always in words, never by colour alone.
const MARKER: Record<StageStatus, string> = {
  waiting: "border-2 border-rule text-ink-muted",
  running: "border-2 border-ink bg-card text-ink",
  done: "border-2 border-ink bg-ink text-paper",
  stopped: "border-2 border-dashed border-ink bg-card text-ink",
  "not-run": "border-2 border-dashed border-rule text-ink-muted",
};

function statusText(stage: StageView): string {
  switch (stage.status) {
    case "waiting":
      return "Waiting";
    case "running":
      return "Running";
    case "done":
      return `Done in ${formatSeconds(stage.durationMs ?? 0)}`;
    case "stopped":
      return "Stopped";
    case "not-run":
      return "Not run";
  }
}

export function StageItem({ stage }: { stage: StageView }): ReactElement {
  const isRunning = stage.status === "running";

  return (
    <li
      aria-current={isRunning ? "step" : undefined}
      className="grid grid-cols-[1.75rem_1fr] items-start gap-3 py-3"
    >
      <span
        aria-hidden
        className={cn(
          "flex size-7 items-center justify-center rounded-full text-data",
          MARKER[stage.status],
        )}
      >
        {stage.stage}
      </span>
      <div className="flex flex-col">
        <span className="text-body font-semibold text-ink">{stage.name}</span>
        <span
          className={cn(
            "flex items-center gap-1.5 text-small",
            isRunning ? "text-ink" : "text-ink-muted",
          )}
        >
          {STAGE_KIND_LABEL[stage.kind]} · {statusText(stage)}
          {isRunning && (
            <LoaderCircle aria-hidden className="size-3.5 animate-spin" />
          )}
        </span>
      </div>
    </li>
  );
}
