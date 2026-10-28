/**
 * File: RunHeader.tsx
 * Purpose: Top of the Live run page: the heading and lead, the live "Now" line while running, and the next actions.
 * Exports: RunHeader
 * Used by: components/run/RunScreen.tsx
 */
import type { ReactElement } from "react";
import { Link } from "react-router";
import { AppIcon } from "@/components/shared/AppIcon";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { findLibrarySlug } from "@/mocks/guides";
import { buttonVariants } from "@/components/ui/button-variants";
import type { RunCopy } from "./run-copy";

type RunHeaderProps = {
  copy: RunCopy;
  appName: string | null;
  currentStageName: string | null;
  isRunning: boolean;
};

export function RunHeader({
  copy,
  appName,
  currentStageName,
  isRunning,
}: RunHeaderProps): ReactElement {
  const appSlug = appName ? findLibrarySlug(appName) : null;
  const status = isRunning
    ? currentStageName
      ? `Now: ${currentStageName}.`
      : ""
    : `${copy.heading}.`;

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
