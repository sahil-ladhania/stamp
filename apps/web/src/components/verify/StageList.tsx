/**
 * File: StageList.tsx
 * Purpose: The nine pipeline stages in a grid, each marked with who does the work, in words.
 * Exports: StageList
 * Used by: components/verify/QuoteCheckSection.tsx
 */
import type { ReactElement } from "react";
import { cn } from "@/lib/utils";
import { RUN_STAGES, STAGE_KIND_LABEL } from "@/utils/run-stages";

/** The two AI model stages get a darker border so the "two of nine" claim can be seen at a glance. */
export function StageList(): ReactElement {
  return (
    <ol className="grid grid-cols-2 gap-3 tablet:grid-cols-3">
      {RUN_STAGES.map((stage) => (
        <li
          key={stage.stage}
          className={cn(
            "flex flex-col gap-1 rounded-md border bg-card p-3",
            stage.kind === "model" ? "border-ink" : "border-rule",
          )}
        >
          <span className="text-data text-ink-muted">{stage.stage}</span>
          <span className="text-body font-semibold text-ink">{stage.name}</span>
          <span
            className={cn(
              "text-small",
              stage.kind === "model" ? "text-ink" : "text-ink-muted",
            )}
          >
            {STAGE_KIND_LABEL[stage.kind]}
          </span>
        </li>
      ))}
    </ol>
  );
}
