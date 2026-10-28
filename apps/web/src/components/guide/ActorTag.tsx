/**
 * File: ActorTag.tsx
 * Purpose: Who does a step, as an icon and a word. Never colour alone.
 * Exports: ActorTag
 * Used by: components/guide/StepCard.tsx, NextStepCard.tsx, StepsSection.tsx
 */
import type { ReactElement } from "react";
import type { Actor } from "@stamp/schema";
import { ACTOR_META } from "@/utils/actor";

export function ActorTag({ actor }: { actor: Actor }): ReactElement {
  const { label, icon: Icon } = ACTOR_META[actor];

  return (
    <span className="inline-flex items-center gap-1.5 text-small text-ink">
      <Icon aria-hidden className="size-4" />
      {label}
    </span>
  );
}
