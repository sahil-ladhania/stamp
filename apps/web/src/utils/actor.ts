/**
 * File: actor.ts
 * Purpose: Who does a step: its label and icon, and a count of steps per actor.
 * Exports: ACTOR_META, countActors
 * Used by: components/guide/ActorTag.tsx, components/guide/StepsSection.tsx
 */
import { Bot, Handshake, User, type LucideIcon } from "lucide-react";
import type { Actor, Step } from "@/mocks/types";

export const ACTOR_META: Record<Actor, { label: string; icon: LucideIcon }> = {
  agent: { label: "Agent", icon: Bot },
  agent_assist: { label: "Agent assist", icon: Handshake },
  human: { label: "Human", icon: User },
};

const ACTOR_ORDER: readonly Actor[] = ["agent", "agent_assist", "human"];

/** Counts steps per actor, in a fixed order, leaving out actors with none. */
export function countActors(
  steps: readonly Step[],
): { actor: Actor; count: number }[] {
  return ACTOR_ORDER.map((actor) => ({
    actor,
    count: steps.filter((step) => step.actor === actor).length,
  })).filter((item) => item.count > 0);
}
