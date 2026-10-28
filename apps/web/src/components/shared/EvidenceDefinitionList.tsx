/**
 * File: EvidenceDefinitionList.tsx
 * Purpose: The three evidence labels, each with what it means and how it is set. One source for every page that explains them.
 * Exports: EvidenceDefinitionList
 * Used by: components/landing/EvidenceSection.tsx, components/verify/LabelsSection.tsx
 */
import type { ReactElement } from "react";
import { cn } from "@/lib/utils";
import { EVIDENCE_KINDS, EVIDENCE_META } from "@/utils/evidence";
import { EvidenceLabel } from "./EvidenceLabel";

/** Meanings and rules come from `utils/evidence.ts`, so the wording never drifts between pages. */
export function EvidenceDefinitionList({
  className,
}: {
  className?: string;
}): ReactElement {
  return (
    <dl
      className={cn(
        "flex flex-col divide-y divide-rule border-y border-rule",
        className,
      )}
    >
      {EVIDENCE_KINDS.map((kind) => (
        <div
          key={kind}
          className="grid gap-2 py-4 tablet:grid-cols-[8rem_1fr] tablet:gap-4"
        >
          <dt>
            <EvidenceLabel kind={kind} />
          </dt>
          <dd className="flex flex-col gap-1">
            <p className="text-body text-ink">{EVIDENCE_META[kind].meaning}.</p>
            <p className="text-small text-ink-muted">
              How it is set: {EVIDENCE_META[kind].howSet}.
            </p>
          </dd>
        </div>
      ))}
    </dl>
  );
}
