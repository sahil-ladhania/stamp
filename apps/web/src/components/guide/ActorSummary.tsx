/**
 * File: ActorSummary.tsx
 * Purpose: Says who does the steps in one sentence ("11 steps: 11 by you, 0 by an agent"), with a small legend of what each
 *          actor chip means, so the count explains itself.
 * Exports: ActorSummary
 * Used by: components/guide/StepsSection.tsx
 */
import type { Actor } from "@stamp/schema";
import type { ReactElement } from "react";
import { ActorChip } from "@/components/shared/ActorChip";
import type { Step } from "@/types/guide-model";
import { summarizeActors } from "@/utils/summarize-actors";

const LEGEND: readonly { actor: Actor; text: string }[] = [
  { actor: "human", text: "You do it." },
  { actor: "agent", text: "Your agent can do it." },
  { actor: "agent_assist", text: "Your agent helps and you confirm." },
];

export function ActorSummary({ steps }: { steps: readonly Step[] }): ReactElement {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-body font-semibold text-ink">{summarizeActors(steps).text}</p>
      <ul aria-label="What the actors mean" className="flex flex-wrap gap-x-6 gap-y-2">
        {LEGEND.map(({ actor, text }) => (
          <li key={actor} className="flex items-center gap-2 text-small text-ink-muted">
            <ActorChip actor={actor} />
            {text}
          </li>
        ))}
      </ul>
    </div>
  );
}
