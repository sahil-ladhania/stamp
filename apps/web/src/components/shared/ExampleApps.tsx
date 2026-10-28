/**
 * File: ExampleApps.tsx
 * Purpose: A labelled row of links to library guides, so a visitor can try a real app in one click.
 * Exports: ExampleApps
 * Used by: components/landing/Hero.tsx, Not found page (step 2)
 */
import { useId, type ReactElement } from "react";
import { Link } from "react-router";
import { cn } from "@/lib/utils";
import type { GuideSummary } from "@/mocks/types";

type ExampleAppsProps = {
  apps: readonly GuideSummary[];
  className?: string;
};

/** Plain links to `/g/:slug`, styled as pills. */
export function ExampleApps({
  apps,
  className,
}: ExampleAppsProps): ReactElement {
  const labelId = useId();

  return (
    <div
      className={cn("flex flex-wrap items-center gap-x-3 gap-y-2", className)}
    >
      <p id={labelId} className="text-small text-ink-muted">
        Library guides:
      </p>
      <ul aria-labelledby={labelId} className="flex flex-wrap gap-2">
        {apps.map((app) => (
          <li key={app.slug}>
            <Link
              to={`/g/${app.slug}`}
              className="inline-block rounded-full border border-rule px-3 py-1 text-small text-ink transition-colors hover:border-ink-muted"
            >
              {app.appName}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
