/**
 * File: UncertainNote.tsx
 * Purpose: An amber note that says plainly something is Uncertain: a section Stamp could not confirm, or a group with no items.
 * Exports: UncertainNote
 * Used by: components/guide/MissingSection.tsx, ClaimGroup.tsx, StepsSection.tsx, BlockersSection.tsx
 */
import type { ReactElement, ReactNode } from "react";
import { CircleHelp } from "lucide-react";

export function UncertainNote({ children }: { children: ReactNode }): ReactElement {
  return (
    <p className="flex items-start gap-3 rounded-md border border-uncertain bg-uncertain-bg p-4 text-body text-ink">
      <CircleHelp aria-hidden className="mt-0.5 size-5 shrink-0" />
      {children}
    </p>
  );
}
