/**
 * File: NextStepCard.tsx
 * Purpose: The one step to do first: title, who does it, how long (with its label), and its detail with evidence.
 *          Unknown if not researched.
 * Exports: NextStepCard
 * Used by: components/guide/StartHereSection.tsx
 */
import { useId, type ReactElement } from "react";
import { EvidenceLabel } from "@/components/shared/EvidenceLabel";
import type { Step } from "@/types/guide-model";
import { ActorTag } from "./ActorTag";
import { ClaimEvidence } from "./ClaimEvidence";
import { UnknownValue } from "./UnknownValue";

export function NextStepCard({
  step,
}: {
  step: Step | undefined;
}): ReactElement {
  const headingId = useId();

  return (
    <article
      aria-labelledby={headingId}
      className="flex flex-col gap-3 rounded-md border border-ink bg-card p-card"
    >
      <h3 id={headingId} className="text-small text-ink-muted">
        Next step
      </h3>
      {step ? (
        <>
          <p className="text-card-title text-ink">{step.title}</p>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-small text-ink-muted">
            <ActorTag actor={step.actor} />
            <span aria-hidden>·</span>
            <span className="text-data text-ink">{step.effort.text}</span>
            <EvidenceLabel kind={step.effort.label} />
          </p>
          <p className="text-body text-ink-muted">{step.detail.text}</p>
          <ClaimEvidence claim={step.detail} />
        </>
      ) : (
        <UnknownValue />
      )}
    </article>
  );
}
