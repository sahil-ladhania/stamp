/**
 * File: MilestoneBar.tsx
 * Purpose: The two milestones on one track: first test and production, each with how long it takes and what it
 *          waits on, and the evidence for both. The track is not to scale: no source gives durations to scale it by.
 * Exports: MilestoneBar
 * Used by: components/guide/MilestonesSection.tsx
 */
import type { ReactElement } from "react";
import type { Milestone } from "@/types/guide-model";
import { ClaimEvidence } from "./ClaimEvidence";

export function MilestoneBar({
  milestones,
}: {
  milestones: readonly Milestone[];
}): ReactElement {
  return (
    <ol className="grid gap-8 tablet:grid-cols-2 tablet:gap-6">
      {milestones.map((milestone) => (
        <li
          key={milestone.id}
          className="relative flex flex-col gap-3 border-t-2 border-ink pt-4"
        >
          <span
            aria-hidden
            className="absolute -top-[7px] left-0 size-3 rounded-full bg-ink"
          />
          <h3 className="text-card-title text-ink">{milestone.title}</h3>
          <dl className="flex flex-col gap-3">
            {[
              { label: "Time", claim: milestone.effort, textClass: "text-data" },
              { label: "Waits on", claim: milestone.wait, textClass: "text-body" },
            ].map(({ label, claim, textClass }) => (
              <div
                key={label}
                className="grid gap-1 tablet:grid-cols-[5.5rem_1fr] tablet:gap-3"
              >
                <dt className="text-small text-ink-muted">{label}</dt>
                <dd className="flex flex-col gap-2">
                  <span className={`${textClass} text-ink`}>{claim.text}</span>
                  <ClaimEvidence claim={claim} />
                </dd>
              </div>
            ))}
          </dl>
        </li>
      ))}
    </ol>
  );
}
