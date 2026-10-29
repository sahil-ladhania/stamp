/**
 * File: ActorChip.tsx
 * Purpose: Who does a step, as an icon and a word in a small chip. Never colour alone.
 * Exports: ActorChip
 * Used by: components/verdict/VerdictRow.tsx, components/guide/StepRow.tsx, components/guide/ActorSummary.tsx
 */
import type { ReactElement } from "react";
import type { Actor } from "@stamp/schema";
import { ACTOR_META } from "@/utils/actor";

export function ActorChip({ actor }: { actor: Actor }): ReactElement {
  const { label, icon: Icon } = ACTOR_META[actor];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-rule px-2 py-0.5 text-small text-ink">
      <Icon aria-hidden className="size-3.5 text-ink-muted" />
      {label}
    </span>
  );
}
