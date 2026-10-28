/**
 * File: SourceQuotes.tsx
 * Purpose: The verbatim quotes behind a claim, behind a native "Show quote" disclosure so the keyboard and screen readers work.
 * Exports: SourceQuotes
 * Used by: components/guide/ClaimEvidence.tsx
 */
import type { ReactElement } from "react";
import type { Source } from "@/types/guide-model";

/** Renders nothing when no source has a quote. */
export function SourceQuotes({
  sources,
}: {
  sources: readonly Source[];
}): ReactElement | null {
  const quoted = sources.filter((source) => source.quote);
  if (quoted.length === 0) return null;

  return (
    <details className="text-small">
      <summary className="cursor-pointer text-ink-muted underline underline-offset-4">
        {quoted.length > 1 ? "Show quotes" : "Show quote"}
      </summary>
      <ul className="mt-2 flex flex-col gap-2">
        {quoted.map((source) => (
          <li key={source.url}>
            <blockquote className="border-l-2 border-rule pl-3 text-ink-muted">
              {source.quote}
            </blockquote>
          </li>
        ))}
      </ul>
    </details>
  );
}
