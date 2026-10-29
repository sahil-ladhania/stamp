/**
 * File: AmbiguousOptions.tsx
 * Purpose: The "Did you mean" options for a name that matches several apps, inside the run notice. Each option starts a new run with its
 *          domain.
 * Exports: AmbiguousOptions
 * Used by: components/run/RunScreen.tsx
 */
import type { AppCandidate } from "@stamp/schema";
import type { ReactElement } from "react";
import { AppIdentity } from "@/components/shared/AppIdentity";
import { TextLink } from "@/components/shared/TextLink";

type AmbiguousOptionsProps = {
  options: readonly AppCandidate[];
  /** A run is starting, so the options are disabled. */
  isPending: boolean;
  onChoose: (domain: string) => void;
};

export function AmbiguousOptions({ options, isPending, onChoose }: AmbiguousOptionsProps): ReactElement {
  return (
    <div className="flex flex-col gap-3">
      <ul aria-label="Apps that match" className="flex flex-col gap-2">
        {options.map((option) => (
          <li key={option.domain}>
            <button
              type="button"
              disabled={isPending}
              onClick={() => onChoose(option.domain)}
              className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-md border border-rule bg-paper p-3 text-left transition-colors hover:border-ink-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              <AppIdentity name={option.name} slug={option.name.toLowerCase()} size="md" />
              <span className="font-mono text-data text-ink-muted">{option.domain}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="text-small text-ink-muted">
        None of these? <TextLink to="/app">Search with the full app name or its website</TextLink>
      </p>
    </div>
  );
}
