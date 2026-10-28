/**
 * File: TopBlockerCard.tsx
 * Purpose: The blocker most likely to stop you, in an amber card: cause, fix and evidence. Unknown if not researched.
 * Exports: TopBlockerCard
 * Used by: components/guide/StartHereSection.tsx
 */
import { useId, type ReactElement } from "react";
import type { Blocker } from "@/mocks/types";
import { BlockerDetails } from "./BlockerDetails";
import { ClaimEvidence } from "./ClaimEvidence";
import { UnknownValue } from "./UnknownValue";

/** Amber is the blocker colour in docs/design-system.md; text stays ink for contrast. */
export function TopBlockerCard({
  blocker,
}: {
  blocker: Blocker | undefined;
}): ReactElement {
  const headingId = useId();

  return (
    <article
      aria-labelledby={headingId}
      className="flex flex-col gap-3 rounded-md border border-uncertain bg-uncertain-bg p-card"
    >
      <h3 id={headingId} className="text-small text-ink-muted">
        Top blocker
      </h3>
      {blocker ? (
        <>
          <p className="text-card-title text-ink">{blocker.title}</p>
          <BlockerDetails blocker={blocker} fields={["cause", "fix"]} />
          <ClaimEvidence claim={blocker.claim} />
        </>
      ) : (
        <UnknownValue />
      )}
    </article>
  );
}
