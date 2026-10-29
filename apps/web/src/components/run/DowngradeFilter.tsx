/**
 * File: DowngradeFilter.tsx
 * Purpose: The "Show downgrades only" chip of the Verify group. Pressed is filled ink with paper text, so state never rests on colour.
 * Exports: DowngradeFilter
 * Used by: components/run/StageGroup.tsx
 */
import type { ReactElement } from "react";
import { cn } from "@/lib/utils";

type DowngradeFilterProps = { count: number; isOn: boolean; onToggle: () => void };

export function DowngradeFilter({ count, isOn, onToggle }: DowngradeFilterProps): ReactElement {
  return (
    <button
      type="button"
      aria-pressed={isOn}
      onClick={onToggle}
      className={cn(
        "inline-flex cursor-pointer items-center rounded-full border px-3 py-1 text-small transition-colors",
        isOn ? "border-ink bg-ink text-paper" : "border-rule bg-card text-ink hover:border-ink-muted",
      )}
    >
      {`Show downgrades only (${count})`}
    </button>
  );
}
