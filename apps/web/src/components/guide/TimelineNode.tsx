/**
 * File: TimelineNode.tsx
 * Purpose: One node of the timeline: a marker on the line, the name, the duration in a mono chip, and the explanation in the claim's own
 *          words (three lines at most, then "More") with its label. A node whose claims are all unknown says "No duration found" once, with
 *          one label. A "Waits on" that is unknown is left out. The line runs down on a phone and across on a wide screen.
 * Exports: TimelineNode
 * Used by: components/guide/TimelineSection.tsx
 */
import type { ReactElement } from "react";
import { ClaimLine } from "@/components/evidence/ClaimLine";
import { UnknownValue } from "@/components/shared/UnknownValue";
import { knownParts, type TimelineNodeData } from "./timeline-nodes";

// The connector is the li's ::before. It runs from this marker to the next one, and the last node has none.
const CONNECTOR =
  "before:absolute before:top-3 before:-bottom-9 before:left-[0.4rem] before:w-0.5 before:bg-ink-muted/40 last:before:hidden " +
  "desktop:before:top-[0.4rem] desktop:before:right-[-1.75rem] desktop:before:bottom-auto desktop:before:left-3 desktop:before:h-0.5 desktop:before:w-auto";

const NO_DURATION = "No duration found";

function NodeBody({ node }: { node: TimelineNodeData }): ReactElement | null {
  const firstClaim = node.parts[0]?.claim;
  if (!firstClaim) return null; // The start has nothing to say.
  const parts = knownParts(node);
  if (parts.length === 0) return <UnknownValue text={NO_DURATION} claim={firstClaim} className="text-small" />;

  return (
    <>
      {node.duration ? (
        <span className="w-fit rounded-md border border-rule bg-card px-2 py-0.5 font-mono text-data text-ink">{node.duration}</span>
      ) : (
        <p className="text-small text-ink-muted">{NO_DURATION}</p>
      )}
      {parts.map((part) => (
        <div key={part.claim.id} className="flex flex-col gap-1">
          {part.label && <p className="text-small text-ink-muted">{part.label}</p>}
          <ClaimLine claim={part.claim} max={90} />
        </div>
      ))}
    </>
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
      <NodeBody node={node} />
    </li>
  );
}
