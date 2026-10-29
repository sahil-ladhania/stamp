/**
 * File: RequirementList.tsx
 * Purpose: The requirements as a checklist: a hollow box (not yet done, so no tick), the text and the label of its claim.
 *          An empty list is one quiet "Not found" row.
 * Exports: RequirementList
 * Used by: components/guide/RequirementsSection.tsx
 */
import type { ReactElement } from "react";
import { Square } from "lucide-react";
import { ClaimLine } from "@/components/evidence/ClaimLine";
import { UnknownValue } from "@/components/shared/UnknownValue";
import type { Claim } from "@/types/guide-model";

export function RequirementList({ requirements }: { requirements: readonly Claim[] }): ReactElement {
  if (requirements.length === 0) return <UnknownValue text="No requirements found" />;
  return (
    <ul className="flex flex-col divide-y divide-rule border-y border-rule">
      {requirements.map((claim) => (
        <li key={claim.id} className="flex items-start gap-3 py-3">
          <Square aria-hidden className="mt-0.5 size-4 shrink-0 text-ink-muted" />
          <ClaimLine claim={claim} />
        </li>
      ))}
    </ul>
  );
}
