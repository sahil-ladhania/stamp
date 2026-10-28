/**
 * File: ScrollCue.tsx
 * Purpose: A quiet cue at the bottom of the hero that jumps to the sample verdict. It is still: it does not bounce or pulse.
 * Exports: ScrollCue
 * Used by: components/landing/Hero.tsx
 */
import type { ReactElement } from "react";
import { ChevronDown } from "lucide-react";
import { Link } from "react-router";

export function ScrollCue({ to }: { to: string }): ReactElement {
  return (
    <Link
      to={to}
      className="hidden items-center gap-1 self-center pb-6 text-small text-ink-muted hover:text-ink tablet:inline-flex"
    >
      See an example
      <ChevronDown aria-hidden className="size-4" />
    </Link>
  );
}
