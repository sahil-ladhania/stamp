/**
 * File: ScopeItem.tsx
 * Purpose: One scope as a list item: the scope string in mono, then why it is needed, with its evidence.
 * Exports: ScopeItem
 * Used by: components/guide/RequirementsSection.tsx
 */
import type { ReactElement } from "react";
import type { Scope } from "@/types/guide-model";
import { ClaimEvidence } from "./ClaimEvidence";

/** Render inside a `ul`. The name is a scope string, so it is data, not a sentence. */
export function ScopeItem({ scope }: { scope: Scope }): ReactElement {
  return (
    <li className="flex flex-col gap-2 rounded-md border border-rule bg-card p-3">
      <code className="text-data break-all text-ink">{scope.name}</code>
      <p className="text-body text-ink-muted">{scope.reason.text}</p>
      <ClaimEvidence claim={scope.reason} />
    </li>
  );
}
