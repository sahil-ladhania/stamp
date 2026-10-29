/**
 * File: StampFrame.tsx
 * Purpose: The rubber-stamp shell shared by every stamp: a double border in stamp red around padded content.
 * Exports: StampFrame
 * Used by: components/guide/ResultStamp.tsx
 */
import type { ReactElement, ReactNode } from "react";
import { cn } from "@/lib/utils";

type StampFrameProps = {
  /** Names the stamp for screen readers, for example "Verdict for HubSpot". */
  label: string;
  children: ReactNode;
  /** A one degree tilt from the tablet breakpoint up. */
  isTilted?: boolean;
  /** The stamp lands once on load: a short fade and a small scale-down. */
  hasEntrance?: boolean;
  className?: string;
};

/** Stamp red is reserved for the verdict, so only stamps use this frame. */
export function StampFrame({
  label,
  children,
  isTilted = false,
  hasEntrance = false,
  className,
}: StampFrameProps): ReactElement {
  return (
    <article
      aria-label={label}
      className={cn(
        "rounded-md border-2 border-stamp bg-card p-1",
        isTilted && "tablet:-rotate-1",
        hasEntrance && "animate-in fade-in-0 zoom-in-105 duration-200",
        className,
      )}
    >
      <div className="flex flex-col gap-3 rounded-sm border border-stamp p-4 tablet:p-6">
        {children}
      </div>
    </article>
  );
}
