/**
 * File: ScopesTable.tsx
 * Purpose: The scopes: the name (a scope string in mono with a copy button), what it allows, and the label of that claim. A table from
 *          the tablet width up and a stack on a phone. An empty list is one quiet "Not found" row.
 * Exports: ScopesTable
 * Used by: components/guide/RequirementsSection.tsx
 */
import type { ReactElement } from "react";
import { ClaimEvidence } from "@/components/evidence/ClaimEvidence";
import { ClampedText } from "@/components/shared/ClampedText";
import { UnknownValue } from "@/components/shared/UnknownValue";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Scope } from "@/types/guide-model";
import { isUnknownClaim } from "@/utils/is-unknown-claim";
import { ScopeName } from "./ScopeName";

function Allows({ scope }: { scope: Scope }): ReactElement {
  if (isUnknownClaim(scope.reason)) return <span className="text-body text-ink-muted">Not found</span>;
  return <ClampedText text={scope.reason.text} max={160} className="text-body text-ink" />;
}

export function ScopesTable({ scopes }: { scopes: readonly Scope[] }): ReactElement {
  if (scopes.length === 0) return <UnknownValue text="No scopes found" />;
  return (
    <>
      <div className="hidden tablet:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-2/5 pl-0">Scope</TableHead>
              <TableHead>What it allows</TableHead>
              <TableHead className="pr-0">Evidence</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scopes.map((scope) => (
              <TableRow key={scope.id}>
                <TableCell className="pl-0">
                  <ScopeName name={scope.name} />
                </TableCell>
                <TableCell>
                  <Allows scope={scope} />
                </TableCell>
                <TableCell className="pr-0 whitespace-nowrap">
                  <ClaimEvidence claim={scope.reason} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ul className="flex flex-col divide-y divide-rule border-y border-rule tablet:hidden">
        {scopes.map((scope) => (
          <li key={scope.id} className="flex flex-col items-start gap-2 py-3">
            <ScopeName name={scope.name} />
            <Allows scope={scope} />
            <ClaimEvidence claim={scope.reason} />
          </li>
        ))}
      </ul>
    </>
  );
}
