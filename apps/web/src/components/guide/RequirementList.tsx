/**
 * File: RequirementList.tsx
 * Purpose: The requirements as a list: a quiet bullet (a box would look clickable, and saving progress is on the Won't list), the text and the
 *          label of its claim. An empty list is one quiet "Not found" row.
 * Exports: RequirementList
 * Used by: components/guide/RequirementsSection.tsx
 */
import type { ReactElement } from "react";
import { ClaimLine } from "@/components/evidence/ClaimLine";
import { UnknownValue } from "@/components/shared/UnknownValue";
import type { Claim } from "@/types/guide-model";

export function RequirementList({ requirements }: { requirements: readonly Claim[] }): ReactElement {
  if (requirements.length === 0) return <UnknownValue text="No requirements found" />;
  return (
    <ul className="flex flex-col divide-y divide-rule border-y border-rule">
      {requirements.map((claim) => (
        <li key={claim.id} className="flex items-start gap-3 py-3">
          <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-ink-muted" />
          <ClaimLine claim={claim} />
        </li>
      ))}
    </ul>
  );
}
