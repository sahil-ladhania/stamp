/**
 * File: LibraryList.tsx
 * Purpose: The library list in all four states: ready rows, loading skeleton, empty state and error with retry.
 * Exports: LibraryList
 * Used by: components/app-home/LibrarySection.tsx
 */
import type { GuideSummary } from "@stamp/schema";
import type { ReactElement } from "react";
import { Button } from "@/components/ui/button";
import type { ApiError } from "@/lib/api-error";
import { getApiErrorMessage } from "@/utils/error-messages";
import type { LibraryStatus } from "@/utils/library-status";
import { LibraryEmptyState } from "./LibraryEmptyState";
import { LibraryRow } from "./LibraryRow";

type LibraryListProps = {
  status: LibraryStatus;
  guides: readonly GuideSummary[];
  error: ApiError | null;
  onRetry: () => void;
};

const SKELETON_ROWS = [1, 2, 3, 4, 5] as const;

/** The skeleton is static on purpose: no pulse, so there is no motion to switch off. */
export function LibraryList({
  status,
  guides,
  error,
  onRetry,
}: LibraryListProps): ReactElement {
  if (status === "loading") {
    return (
      <div aria-busy="true" className="flex flex-col gap-3">
        <p role="status" className="text-small text-ink-muted">
          Loading the library
        </p>
        <ul aria-hidden className="flex flex-col gap-3">
          {SKELETON_ROWS.map((row) => (
            <li
              key={row}
              className="flex h-[4.5rem] flex-col justify-center gap-2 rounded-md border border-rule bg-card p-4"
            >
              <span className="h-3 w-24 rounded-sm bg-rule" />
              <span className="h-3 w-2/3 rounded-sm bg-rule" />
            </li>
          ))}
        </ul>
      </div>
    );
  }
  if (status === "empty") return <LibraryEmptyState />;
  if (status === "error") {
    return (
      <div
        role="alert"
        className="flex flex-col items-start gap-4 rounded-md border border-rule bg-card p-card"
      >
        <p className="text-body text-ink">
          {`The library did not load. ${error ? getApiErrorMessage(error) : "Try again."}`}
        </p>
        <Button variant="secondary" onClick={onRetry}>
          Retry loading the library
        </Button>
      </div>
    );
  }
  return (
    <ul className="flex flex-col gap-3">
      {guides.map((guide) => (
        <li key={guide.slug}>
          <LibraryRow guide={guide} />
        </li>
      ))}
    </ul>
  );
}
