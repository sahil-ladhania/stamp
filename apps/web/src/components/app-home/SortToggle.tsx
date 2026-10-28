/**
 * File: SortToggle.tsx
 * Purpose: Two-button toggle that switches the library between easiest first and hardest first.
 * Exports: SortToggle
 * Used by: components/app-home/LibrarySection.tsx
 */
import type { ReactElement } from "react";
import { cn } from "@/lib/utils";
import type { SortOrder } from "@/utils/sort-guides";

type SortToggleProps = {
  value: SortOrder;
  onChange: (order: SortOrder) => void;
};

const OPTIONS = [
  { value: "easiest", label: "Easiest first" },
  { value: "hardest", label: "Hardest first" },
] as const;

/** The pressed button is filled ink with paper text, so state never rests on colour alone. */
export function SortToggle({ value, onChange }: SortToggleProps): ReactElement {
  return (
    <div
      role="group"
      aria-label="Sort by difficulty"
      className="inline-flex rounded-md border border-rule bg-card p-1"
    >
      {OPTIONS.map((option) => {
        const isPressed = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isPressed}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-sm px-3 py-2 text-small transition-colors",
              isPressed ? "bg-ink text-paper" : "text-ink-muted hover:text-ink",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
