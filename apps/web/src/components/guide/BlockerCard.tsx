/**
 * File: BlockerCard.tsx
 * Purpose: One blocker in an amber card: symptom, cause, fix and contact, each with its evidence. Marked when it is the top one.
 * Exports: BlockerCard
 * Used by: components/guide/BlockersSection.tsx
 */
import type { ReactElement } from "react";
import type { Blocker } from "@/types/guide-model";
import { BlockerDetails } from "./BlockerDetails";

type BlockerCardProps = { blocker: Blocker; isTop: boolean };

/** Render inside a `ul`. Text stays ink on the amber tint, which passes AA in both modes. */
export function BlockerCard({
  blocker,
  isTop,
}: BlockerCardProps): ReactElement {
  return (
    <li className="flex flex-col gap-3 rounded-md border border-uncertain bg-uncertain-bg p-card">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="text-card-title text-ink">{blocker.title}</h3>
        {isTop && <span className="text-data text-ink">Top blocker</span>}
      </div>
      <BlockerDetails blocker={blocker} />
    </li>
  );
}
