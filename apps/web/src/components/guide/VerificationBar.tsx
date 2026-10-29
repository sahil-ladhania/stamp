/**
 * File: VerificationBar.tsx
 * Purpose: The verification summary beside the sources: the claims sentence ("11 of 24 claims sourced"), the label bar with its numbers,
 *          and the link to how Stamp verifies. Only Tested means confirmed, so the sentence says "sourced".
 * Exports: VerificationBar
 * Used by: components/guide/SourcesSection.tsx
 */
import type { ReactElement } from "react";
import { LabelBar } from "@/components/shared/LabelBar";
import { TextLink } from "@/components/shared/TextLink";
import type { Guide } from "@/types/guide-model";
import { claimSummary } from "@/utils/claim-summary";

export function VerificationBar({ guide }: { guide: Guide }): ReactElement {
  return (
    <div className="flex flex-col gap-4 rounded-md border border-rule bg-card p-card">
      <p className="text-card-title text-ink">{claimSummary(guide.claims).text}</p>
      <LabelBar claims={guide.claims} />
      <p className="text-body text-ink-muted">Every claim has a label. Uncertain claims say why.</p>
      <TextLink to="/how-we-verify">Read how we verify</TextLink>
    </div>
  );
}
