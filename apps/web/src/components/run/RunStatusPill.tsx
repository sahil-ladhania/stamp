/**
 * File: RunStatusPill.tsx
 * Purpose: The run's state in one pill: a pulsing dot while it works, an icon and a word once it ends. Neutral ink, since the label
 *          colours belong to evidence labels. Under reduced motion the dot is still and the word says it.
 * Exports: RunStatusPill
 * Used by: components/run/RunHeader.tsx
 */
import type { ReactElement } from "react";
import { Check, CircleX, SearchX, TriangleAlert, WifiOff, type LucideIcon } from "lucide-react";
import type { RunPhase } from "@/utils/run-phase";

/** A null icon is the live dot. */
const PHASE: Record<RunPhase, { label: string; icon: LucideIcon | null }> = {
  connecting: { label: "Connecting", icon: null },
  running: { label: "Researching", icon: null },
  done: { label: "Done", icon: Check },
  partial: { label: "Partial", icon: TriangleAlert },
  stopped: { label: "Stopped", icon: CircleX },
  disconnected: { label: "Disconnected", icon: WifiOff },
  "not-found": { label: "Not found", icon: SearchX },
};

export function RunStatusPill({ phase }: { phase: RunPhase }): ReactElement {
  const { label, icon: Icon } = PHASE[phase];
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-rule bg-card px-3 py-1 text-small font-medium text-ink">
      {Icon ? (
        <Icon aria-hidden className="size-3.5" />
      ) : (
        <span aria-hidden className="size-2 rounded-full bg-ink motion-safe:animate-pulse" />
      )}
      {label}
    </span>
  );
}
