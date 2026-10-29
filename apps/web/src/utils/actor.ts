/**
 * File: actor.ts
 * Purpose: Who does a step: its label and icon.
 * Exports: ACTOR_META
 * Used by: components/shared/ActorChip.tsx
 */
import { Bot, Handshake, User, type LucideIcon } from "lucide-react";
import type { Actor } from "@stamp/schema";

export const ACTOR_META: Record<Actor, { label: string; icon: LucideIcon }> = {
  agent: { label: "Agent", icon: Bot },
  agent_assist: { label: "Agent assist", icon: Handshake },
  human: { label: "Human", icon: User },
};
