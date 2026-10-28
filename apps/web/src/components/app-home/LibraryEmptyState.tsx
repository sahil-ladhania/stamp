/**
 * File: LibraryEmptyState.tsx
 * Purpose: The library when it has no guides yet: a deliberate, small state. Three faint rows show what a guide will look like,
 *          and one button sends the visitor to the search.
 * Exports: LibraryEmptyState
 * Used by: components/app-home/LibrarySection.tsx
 */
import type { ReactElement } from "react";
import { Button } from "@/components/ui/button";
import { APP_SEARCH_INPUT_ID } from "./app-search-id";
import { LibraryGhostRows } from "./LibraryGhostRows";

export function LibraryEmptyState(): ReactElement {
  function focusSearch(): void {
    document.getElementById(APP_SEARCH_INPUT_ID)?.focus();
  }

  return (
    <div className="flex flex-col gap-6">
      <LibraryGhostRows count={3} />
      <div className="flex flex-col items-start gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-card-title text-ink">No library guides yet</p>
          <p className="text-body text-ink-muted">
            Search any app. Stamp researches it live, and the guide gets its own link you can share.
          </p>
        </div>
        {/* Secondary: the search button above is the page's red action. */}
        <Button variant="secondary" onClick={focusSearch}>
          Search for an app
        </Button>
      </div>
    </div>
  );
}
