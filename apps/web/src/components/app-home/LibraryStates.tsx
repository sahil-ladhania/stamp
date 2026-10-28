/**
 * File: LibraryStates.tsx
 * Purpose: The library when it is loading and when it failed to load.
 * Exports: LibraryLoading, LibraryError
 * Used by: components/app-home/LibrarySection.tsx
 */
import type { ReactElement } from "react";
import { Button } from "@/components/ui/button";
import type { ApiError } from "@/lib/api-error";
import { getApiErrorMessage } from "@/utils/error-messages";
import { LibraryGhostRows } from "./LibraryGhostRows";

export function LibraryLoading(): ReactElement {
  return (
    <div aria-busy="true" className="flex flex-col gap-3">
      <p role="status" className="text-small text-ink-muted">
        Loading the library
      </p>
      <LibraryGhostRows count={5} />
    </div>
  );
}

type LibraryErrorProps = { error: ApiError | null; onRetry: () => void };

export function LibraryError({ error, onRetry }: LibraryErrorProps): ReactElement {
  return (
    <div role="alert" className="flex flex-col items-start gap-4 rounded-md border border-rule bg-card p-card">
      <p className="text-body text-ink">{`The library did not load. ${error ? getApiErrorMessage(error) : "Try again."}`}</p>
      <Button variant="secondary" onClick={onRetry}>
        Retry loading the library
      </Button>
    </div>
  );
}
