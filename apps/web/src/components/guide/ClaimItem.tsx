/**
 * File: ClaimItem.tsx
 * Purpose: One claim as a list item: its text and its evidence, for the requirements and limits groups.
 * Exports: ClaimItem
 * Used by: components/guide/RequirementsSection.tsx
 */
import type { ReactElement } from "react";
import type { Claim } from "@/types/guide-model";
import { ClaimEvidence } from "./ClaimEvidence";

/** Render inside a `ul`. */
export function ClaimItem({ claim }: { claim: Claim }): ReactElement {
  return (
    <li className="flex flex-col gap-2 rounded-md border border-rule bg-card p-3">
      <p className="text-body text-ink">{claim.text}</p>
      <ClaimEvidence claim={claim} />
    </li>
  );
}
