/**
 * File: TimelineNode.tsx
 * Purpose: One node of the timeline: a marker on the line, the name, the duration in a mono chip (or a quiet "No duration stated"),
 *          and the explanation under it in the claim's own words, with its label. The line runs down on a phone and across on a
 *          wide screen.
 * Exports: TimelineNode
 * Used by: components/guide/TimelineSection.tsx
 */
import type { ReactElement } from "react";
import { ClaimLine } from "@/components/evidence/ClaimLine";
import { UnknownValue } from "@/components/shared/UnknownValue";
import type { TimelineNodeData } from "./timeline-nodes";

// The connector is the li's ::before. It runs from this marker to the next one, and the last node has none.
const CONNECTOR =
  "before:absolute before:top-3 before:-bottom-9 before:left-[0.4rem] before:w-0.5 before:bg-ink-muted/40 last:before:hidden " +
  "desktop:before:top-[0.4rem] desktop:before:right-[-1.75rem] desktop:before:bottom-auto desktop:before:left-3 desktop:before:h-0.5 desktop:before:w-auto";

function DurationChip({ duration }: { duration: string | null }): ReactElement {
  if (duration === null) return <UnknownValue text="No duration stated" hasBadge={false} className="text-small" />;
  return (
    <span className="w-fit rounded-md border border-rule bg-card px-2 py-0.5 font-mono text-data text-ink">{duration}</span>
  );
}

export function TimelineNode({ node }: { node: TimelineNodeData }): ReactElement {
  return (
    <li className={`relative flex flex-col gap-2 pl-8 desktop:pt-8 desktop:pl-0 ${CONNECTOR}`}>
      <span
        aria-hidden
        className="absolute top-1 left-0 z-10 size-3.5 rounded-full border-2 border-ink bg-paper desktop:top-0"
      />
      <h3 className="text-card-title text-ink">{node.title}</h3>
      {node.duration !== undefined && <DurationChip duration={node.duration} />}
      {node.parts.map((part) => (
        <div key={part.claim.id} className="flex flex-col gap-1">
          {part.label && <p className="text-small text-ink-muted">{part.label}</p>}
          <ClaimLine claim={part.claim} max={140} />
        </div>
      ))}
    </li>
  );
}
