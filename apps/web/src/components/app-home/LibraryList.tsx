/**
 * File: LibraryList.tsx
 * Purpose: The library list in all four states: ready rows, loading skeleton, empty message and error with retry.
 * Exports: LibraryList
 * Used by: components/app-home/LibrarySection.tsx
 */
import type { ReactElement } from "react";
import { Link } from "react-router";
import { buttonVariants } from "@/components/ui/button-variants";
import type { GuideSummary } from "@/mocks/types";
import type { LibraryStatus } from "./library-status";
import { LibraryRow } from "./LibraryRow";

type LibraryListProps = {
  status: LibraryStatus;
  guides: readonly GuideSummary[];
};

const SKELETON_ROWS = [1, 2, 3, 4, 5] as const;

/** The skeleton is static on purpose: no pulse, so there is no motion to switch off. */
export function LibraryList({
  status,
  guides,
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

  if (status === "empty") {
    return (
      <p className="rounded-md border border-rule bg-card p-card text-body text-ink">
        The library is empty right now. Search for an app instead.
      </p>
    );
  }

  if (status === "error") {
    return (
      <div
        role="alert"
        className="flex flex-col items-start gap-4 rounded-md border border-rule bg-card p-card"
      >
        <p className="text-body text-ink">
          The library did not load. Check your connection, then retry.
        </p>
        <Link to="/app" className={buttonVariants({ variant: "secondary" })}>
          Retry loading the library
        </Link>
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
