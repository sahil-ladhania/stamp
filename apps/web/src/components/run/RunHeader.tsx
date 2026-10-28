/**
 * File: RunHeader.tsx
 * Purpose: Top of the Live run page: the heading and lead, the live "Now" line while running, and the next actions.
 * Exports: RunHeader
 * Used by: components/run/RunScreen.tsx
 */
import type { ReactElement } from "react";
import { Link } from "react-router";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { buttonVariants } from "@/components/ui/button-variants";
import type { RunCopy } from "./run-copy";

type RunHeaderProps = {
  copy: RunCopy;
  currentStageName: string | null;
  isRunning: boolean;
};

export function RunHeader({
  copy,
  currentStageName,
  isRunning,
}: RunHeaderProps): ReactElement {
  const status = isRunning
    ? currentStageName
      ? `Now: ${currentStageName}.`
      : ""
    : `${copy.heading}.`;

  return (
    <div className="flex flex-col gap-4">
      <SectionHeading level={1} title={copy.heading} description={copy.lead} />
      {/* Announced politely on every stage change. Hidden once the run ends: the heading says it. */}
      <p
        role="status"
        className={isRunning && status ? "text-data text-ink" : "sr-only"}
      >
        {status}
      </p>
      {copy.actions.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          {copy.actions.map((action) => (
            <Link
              key={action.label}
              to={action.to}
              className={buttonVariants({
                variant: action.variant,
                size: "lg",
              })}
            >
              {action.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
