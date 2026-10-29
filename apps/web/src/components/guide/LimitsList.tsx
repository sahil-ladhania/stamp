/**
 * File: LimitsList.tsx
 * Purpose: The limits that apply, one claim per row with its label. An empty list is one quiet "Not found" row.
 * Exports: LimitsList
 * Used by: components/guide/RequirementsSection.tsx
 */
import type { ReactElement } from "react";
import { ClaimLine } from "@/components/evidence/ClaimLine";
import { UnknownValue } from "@/components/shared/UnknownValue";
import type { Claim } from "@/types/guide-model";

export function LimitsList({ limits }: { limits: readonly Claim[] }): ReactElement {
  if (limits.length === 0) return <UnknownValue text="No limits found" />;
  return (
    <ul className="flex flex-col divide-y divide-rule border-y border-rule">
      {limits.map((claim) => (
        <li key={claim.id} className="py-3">
          <ClaimLine claim={claim} />
        </li>
      ))}
    </ul>
  );
}
