/**
 * File: LibraryGhostRows.tsx
 * Purpose: Faint outlines of library rows, for the loading state and the empty state: they show what a row will look like.
 *          Static on purpose: no pulse, so there is no motion to switch off.
 * Exports: LibraryGhostRows
 * Used by: components/app-home/LibraryStates.tsx, components/app-home/LibraryEmptyState.tsx
 */
import type { ReactElement } from "react";
import { cn } from "@/lib/utils";

const DOTS = [1, 2, 3, 4, 5] as const;

export function LibraryGhostRows({ count, className }: { count: number; className?: string }): ReactElement {
  return (
    <ul aria-hidden className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: count }, (_, index) => (
        <li
          key={index}
          className="grid grid-cols-[1fr_auto] items-center gap-4 rounded-md border border-dashed border-ink-muted/40 px-4 py-3 tablet:grid-cols-[1fr_7rem_6rem_6rem]"
        >
          <span className="flex items-center gap-2">
            <span className="size-6 rounded-md bg-ink-muted/25" />
            <span className="h-3 w-28 rounded-sm bg-ink-muted/25" />
          </span>
          <span className="inline-flex gap-1">
            {DOTS.map((dot) => (
              <span key={dot} className="size-2.5 rounded-full border border-ink-muted/40" />
            ))}
          </span>
          <span className="hidden h-3 w-16 rounded-sm bg-ink-muted/25 tablet:block" />
          <span className="hidden h-3 w-16 rounded-sm bg-ink-muted/25 tablet:block" />
        </li>
      ))}
    </ul>
  );
}
