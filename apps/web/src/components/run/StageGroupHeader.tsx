/**
 * File: StageGroupHeader.tsx
 * Purpose: The header of one stage group: its name, who runs it (our code, an AI model or an outside call), its state and time, and a
 *          one-line summary. It carries what the old "started" and "done in" rows said. A group with events has a chevron; render it
 *          inside a trigger with the `group` class so the chevron turns.
 * Exports: StageGroupHeader
 * Used by: components/run/StageGroup.tsx, components/landing/StepVisualTrace.tsx
 */
import type { ReactElement } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatSeconds } from "@/utils/format-duration";
import type { StageGroup } from "@/utils/run-groups";
import { STAGE_KIND_LABEL } from "@/utils/run-stages";
import type { StageStatus } from "@/utils/run-view";

const STATUS_WORD: Record<StageStatus, string> = {
  waiting: "Waiting",
  running: "Running",
  done: "Done",
  stopped: "Stopped",
  "not-run": "Not run",
};

type StageGroupHeaderProps = { group: StageGroup; isExpandable: boolean };

export function StageGroupHeader({ group, isExpandable }: StageGroupHeaderProps): ReactElement {
  const isQuiet = group.status === "waiting" || group.status === "not-run";

  return (
    <span className="grid w-full grid-cols-[1rem_1fr] items-start gap-x-3 py-3 text-left">
      {isExpandable ? (
        <ChevronRight
          aria-hidden
          className="mt-1 size-4 text-ink-muted motion-safe:transition-transform group-data-[state=open]:rotate-90"
        />
      ) : (
        <span aria-hidden />
      )}
      <span className="flex min-w-0 flex-col gap-1">
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className={cn("text-card-title", isQuiet ? "text-ink-muted" : "text-ink")}>{group.name}</span>
          <span className="rounded-sm border border-rule px-1.5 text-[0.6875rem] leading-5 text-ink-muted">
            {STAGE_KIND_LABEL[group.kind]}
          </span>
          <span className="inline-flex items-center gap-1.5 text-small text-ink-muted">
            {group.status === "running" && (
              <span aria-hidden className="size-1.5 rounded-full bg-ink motion-safe:animate-pulse" />
            )}
            {STATUS_WORD[group.status]}
            {group.durationMs !== null && (
              <span className="font-mono text-data text-ink">{formatSeconds(group.durationMs)}</span>
            )}
          </span>
        </span>
        {group.summary && <span className="text-body text-ink-muted">{group.summary}</span>}
      </span>
    </span>
  );
}
