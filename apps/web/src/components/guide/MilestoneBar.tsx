/**
 * File: MilestoneBar.tsx
 * Purpose: The two milestones on one track: first test and production, each with its time, what it waits on and its claims.
 *          The track is not to scale: the docs give no durations to scale it by.
 * Exports: MilestoneBar
 * Used by: components/guide/MilestonesSection.tsx
 */
import type { ReactElement } from "react";
import type { Milestone } from "@/mocks/types";
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
          <dl className="flex flex-col gap-2">
            <div className="grid gap-1 tablet:grid-cols-[5.5rem_1fr] tablet:gap-3">
              <dt className="text-small text-ink-muted">Time</dt>
              <dd className="text-data text-ink">{milestone.duration}</dd>
            </div>
            <div className="grid gap-1 tablet:grid-cols-[5.5rem_1fr] tablet:gap-3">
              <dt className="text-small text-ink-muted">Waits on</dt>
              <dd className="text-body text-ink">{milestone.wait}</dd>
            </div>
          </dl>
          <ul className="flex flex-col gap-3">
            {milestone.claims.map((claim) => (
              <li
                key={claim.id}
                className="flex flex-col gap-2 rounded-md border border-rule bg-card p-3"
              >
                <p className="text-body text-ink">{claim.text}</p>
                <ClaimEvidence claim={claim} />
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}
