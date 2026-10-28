/**
 * File: ClaimGroup.tsx
 * Purpose: One titled group of items, or the Uncertain note when the group is empty.
 * Exports: ClaimGroup
 * Used by: components/guide/RequirementsSection.tsx
 */
import type { ReactElement, ReactNode } from "react";
import { UncertainNote } from "./UncertainNote";

type ClaimGroupProps = {
  title: string;
  /** What an empty group says, for example "Stamp found no requirements in its sources." */
  emptyText: string;
  /** How many items the group has. Zero shows the note instead of the list. */
  count: number;
  children: ReactNode;
};

export function ClaimGroup({
  title,
  emptyText,
  count,
  children,
}: ClaimGroupProps): ReactElement {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-card-title text-ink">{title}</h3>
      {count === 0 ? (
        <UncertainNote>{`Uncertain: ${emptyText}`}</UncertainNote>
      ) : (
        <ul className="flex flex-col gap-3">{children}</ul>
      )}
    </div>
  );
}
