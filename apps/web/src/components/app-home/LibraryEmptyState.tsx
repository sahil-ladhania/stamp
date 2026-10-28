/**
 * File: LibraryEmptyState.tsx
 * Purpose: The library list when the library has no guides yet. It is a deliberate state that sends the visitor to the search.
 * Exports: LibraryEmptyState
 * Used by: components/app-home/LibraryList.tsx
 */
import type { ReactElement } from "react";
import { Button } from "@/components/ui/button";
import { APP_SEARCH_INPUT_ID } from "./app-search-id";

export function LibraryEmptyState(): ReactElement {
  function focusSearch(): void {
    document.getElementById(APP_SEARCH_INPUT_ID)?.focus();
  }

  return (
    <div className="flex flex-col items-start gap-4 rounded-md border border-rule bg-card p-card">
      <div className="flex flex-col gap-1">
        <p className="text-card-title text-ink">No library guides yet</p>
        <p className="text-body text-ink-muted">
          Search any app. Stamp researches it live, and the guide gets its own
          link you can share.
        </p>
      </div>
      {/* Secondary: the search button above is the page's red action. */}
      <Button variant="secondary" onClick={focusSearch}>
        Search for an app
      </Button>
    </div>
  );
}
