/**
 * File: ScopeName.tsx
 * Purpose: The name of a scope. A scope string (no spaces) is mono with a copy button, since it is meant to be pasted. A scope the
 *          sources describe in words is shown as plain text, because mono is for code-like values only.
 * Exports: ScopeName
 * Used by: components/guide/ScopesTable.tsx
 */
import type { ReactElement } from "react";
import { CopyButton } from "@/components/shared/CopyButton";
import { looksLikeScopeString } from "@/utils/looks-like-scope";

export function ScopeName({ name }: { name: string }): ReactElement {
  if (!looksLikeScopeString(name)) return <span className="text-body text-ink">{name}</span>;
  return (
    <span className="inline-flex min-w-0 items-center gap-1">
      <code className="min-w-0 font-mono text-data break-all text-ink">{name}</code>
      <CopyButton value={name} label={`Copy scope ${name}`} />
    </span>
  );
}
