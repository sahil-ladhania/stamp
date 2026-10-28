/**
 * File: AmbiguousOptions.tsx
 * Purpose: The "Did you mean" panel for a name that matches several apps. Each option starts a new run with its domain.
 * Exports: AmbiguousOptions
 * Used by: components/run/RunScreen.tsx
 */
import type { AppCandidate } from "@stamp/schema";
import type { ReactElement } from "react";
import { Link } from "react-router";
import { AppIcon } from "@/components/shared/AppIcon";

type AmbiguousOptionsProps = {
  options: readonly AppCandidate[];
  /** A run is starting, so the options are disabled. */
  isPending: boolean;
  onChoose: (domain: string) => void;
};

export function AmbiguousOptions({
  options,
  isPending,
  onChoose,
}: AmbiguousOptionsProps): ReactElement {
  return (
    <section
      aria-labelledby="ambiguous-heading"
      className="flex flex-col gap-4 rounded-md border border-rule bg-card p-card"
    >
      <div className="flex flex-col gap-1">
        <h2 id="ambiguous-heading" className="text-card-title text-ink">
          Did you mean one of these apps?
        </h2>
        <p className="text-body text-ink-muted">
          {options.length > 0
            ? "The name matches more than one app. Pick one and Stamp researches it."
            : "The name matches more than one app, and Stamp no longer has the list. Search again with the full name or the website."}
        </p>
      </div>
      {options.length > 0 && (
        <ul className="flex flex-col gap-3">
          {options.map((option) => (
            <li key={option.domain}>
              <button
                type="button"
                disabled={isPending}
                onClick={() => onChoose(option.domain)}
                className="flex w-full items-center justify-between gap-3 rounded-md border border-rule p-3 text-left transition-colors hover:border-ink-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="flex items-center gap-2 text-card-title text-ink">
                  <AppIcon
                    slug={option.name.toLowerCase()}
                    className="text-ink-muted"
                  />
                  {option.name}
                </span>
                <span className="text-data text-ink-muted">{option.domain}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="text-small text-ink-muted">
        None of these?{" "}
        <Link to="/app" className="text-sourced underline underline-offset-4">
          Search with the full app name or its website
        </Link>
        .
      </p>
    </section>
  );
}
