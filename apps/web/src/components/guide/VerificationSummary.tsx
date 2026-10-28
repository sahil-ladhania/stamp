/**
 * File: VerificationSummary.tsx
 * Purpose: How many claims in this guide carry each evidence label, counted from the guide itself.
 * Exports: VerificationSummary
 * Used by: components/guide/SourcesSection.tsx
 */
import type { ReactElement } from "react";
import { Link } from "react-router";
import { EvidenceLabel } from "@/components/shared/EvidenceLabel";
import type { Guide } from "@/mocks/types";
import { collectClaims, countByLabel } from "@/utils/claims";
import { EVIDENCE_KINDS } from "@/utils/evidence";
import { pluralize } from "@/utils/plural";

export function VerificationSummary({ guide }: { guide: Guide }): ReactElement {
  const claims = collectClaims(guide);
  const counts = countByLabel(claims);

  return (
    <div className="flex flex-col gap-3 rounded-md border border-rule bg-card p-card">
      <p className="text-card-title text-ink">
        {pluralize(claims.length, "claim")} in this guide
      </p>
      <ul className="flex flex-wrap gap-x-5 gap-y-2">
        {EVIDENCE_KINDS.map((kind) => (
          <li key={kind} className="flex items-center gap-2">
            <EvidenceLabel kind={kind} />
            <span className="text-data text-ink">{counts[kind]}</span>
          </li>
        ))}
      </ul>
      <p className="text-body text-ink-muted">
        Every claim has a label. Uncertain claims say why.
      </p>
      <Link
        to="/how-we-verify"
        className="self-start text-body text-sourced underline underline-offset-4"
      >
        Read how we verify
      </Link>
    </div>
  );
}
