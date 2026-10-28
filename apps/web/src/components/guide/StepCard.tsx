/**
 * File: StepCard.tsx
 * Purpose: One step: its number, title, who does it, how long (with its own label), the detail and the evidence.
 * Exports: StepCard
 * Used by: components/guide/StepsSection.tsx
 */
import type { ReactElement } from "react";
import type { Step } from "@/types/guide-model";
import { ActorTag } from "./ActorTag";
import { ClaimEvidence } from "./ClaimEvidence";

type StepCardProps = { step: Step; number: number };

/** Render inside an `ol`. Both the effort and the detail are claims, so both show their label. */
export function StepCard({ step, number }: StepCardProps): ReactElement {
  return (
    <li className="grid grid-cols-[2.25rem_1fr] gap-4 rounded-md border border-rule bg-card p-4 tablet:p-6">
      <span
        aria-hidden
        className="flex size-9 items-center justify-center rounded-full border-2 border-ink text-data text-ink"
      >
        {number}
      </span>
      <div className="flex flex-col gap-3">
        <h3 className="text-card-title text-ink">{step.title}</h3>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-small text-ink-muted">
          <ActorTag actor={step.actor} />
          <span aria-hidden>·</span>
          <span className="text-data text-ink">{step.effort.text}</span>
        </p>
        <ClaimEvidence claim={step.effort} />
        <p className="text-body text-ink-muted">{step.detail.text}</p>
        <ClaimEvidence claim={step.detail} />
      </div>
    </li>
  );
}
