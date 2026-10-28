/**
 * File: ExampleApps.tsx
 * Purpose: A labelled row of links to library guides, so a visitor can try a real app in one click.
 * Exports: ExampleApps
 * Used by: components/landing/Hero.tsx, components/not-found/NotFoundPanel.tsx
 */
import type { GuideSummary } from "@stamp/schema";
import { useId, type ReactElement } from "react";
import { Link } from "react-router";
import { AppIcon } from "@/components/shared/AppIcon";
import { cn } from "@/lib/utils";

type ExampleAppsProps = {
  apps: readonly GuideSummary[];
  /** The words before the links. */
  label?: string;
  /** Show at most this many. */
  max?: number;
  className?: string;
};

/** Plain links to `/g/:slug`, styled as pills. */
export function ExampleApps({
  apps,
  label = "Library guides:",
  max = apps.length,
  className,
}: ExampleAppsProps): ReactElement {
  const labelId = useId();

  return (
    <div
      className={cn("flex flex-wrap items-center gap-x-3 gap-y-2", className)}
    >
      <p id={labelId} className="text-small text-ink-muted">
        {label}
      </p>
      <ul aria-labelledby={labelId} className="flex flex-wrap gap-2">
        {apps.slice(0, max).map((app) => (
          <li key={app.slug}>
            <Link
              to={`/g/${app.slug}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-rule px-3 py-1 text-small text-ink transition-colors hover:border-ink-muted"
            >
              <AppIcon slug={app.slug} className="size-4 text-ink-muted" />
              {app.appName}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
