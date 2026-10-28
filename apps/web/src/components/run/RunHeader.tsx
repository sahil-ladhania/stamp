/**
 * File: RunHeader.tsx
 * Purpose: Top of the Live run page: the heading and lead, the polite status line, and the next actions.
 * Exports: RunHeader
 * Used by: components/run/RunScreen.tsx
 */
import type { ReactElement, ReactNode } from "react";
import { AppIcon } from "@/components/shared/AppIcon";
import { SectionHeading } from "@/components/shared/SectionHeading";
import type { RunCopy } from "./run-copy";

type RunHeaderProps = {
  copy: RunCopy;
  /** The run's slug, for the app mark. Only the library apps have one. */
  appSlug: string | null;
  /** Announced politely on every change. Hidden once the run ends: the heading says it. */
  statusLine: string;
  isRunning: boolean;
  actions: ReactNode;
};

export function RunHeader({
  copy,
  appSlug,
  statusLine,
  isRunning,
  actions,
}: RunHeaderProps): ReactElement {
  return (
    <div className="flex flex-col gap-4">
      <SectionHeading
        level={1}
        title={
          <span className="inline-flex items-center gap-3">
            {appSlug && (
              <AppIcon slug={appSlug} className="size-7 text-ink-muted" />
            )}
            {copy.heading}
          </span>
        }
        description={copy.lead}
      />
      <p
        role="status"
        className={isRunning && statusLine ? "text-data text-ink" : "sr-only"}
      >
        {statusLine}
      </p>
      {actions}
    </div>
  );
}
