/**
 * File: JumpToLatest.tsx
 * Purpose: The "Jump to latest" button: shown when new rows arrived while the reader was scrolled up. It sits at the bottom of the screen.
 * Exports: JumpToLatest
 * Used by: components/run/RunScreen.tsx
 */
import type { ReactElement } from "react";
import { ArrowDown } from "lucide-react";

export function JumpToLatest({ onClick }: { onClick: () => void }): ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-4 left-1/2 z-40 inline-flex -translate-x-1/2 cursor-pointer items-center gap-2 rounded-full border border-ink bg-card px-4 py-2 text-small font-medium text-ink transition-colors hover:bg-paper motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-150"
    >
      <ArrowDown aria-hidden className="size-4" />
      Jump to latest
    </button>
  );
}
