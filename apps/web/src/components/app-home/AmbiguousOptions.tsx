/**
 * File: AmbiguousOptions.tsx
 * Purpose: The "Did you mean" panel for a name that matches several apps. Each option opens its guide.
 * Exports: AmbiguousOptions
 * Used by: components/app-home/LookupSection.tsx
 */
import type { ReactElement } from "react";
import { Link } from "react-router";
import type { AmbiguousOption } from "@/mocks/ambiguous";

type AmbiguousOptionsProps = {
  query: string;
  options: readonly AmbiguousOption[];
};

export function AmbiguousOptions({
  query,
  options,
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
          {`"${query}" matches more than one app. Pick one and Stamp opens its guide.`}
        </p>
      </div>
      <ul className="flex flex-col gap-3">
        {options.map((option) => (
          <li key={option.slug}>
            <Link
              to={`/g/${option.slug}`}
              aria-label={`Open the ${option.name} guide`}
              className="flex items-baseline justify-between gap-3 rounded-md border border-rule p-3 transition-colors hover:border-ink-muted"
            >
              <span className="text-card-title text-ink">{option.name}</span>
              <span className="text-data text-ink-muted">{option.domain}</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="text-small text-ink-muted">
        None of these? Search with the full app name or its website.
      </p>
    </section>
  );
}
