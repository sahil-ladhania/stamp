/**
 * File: StampMark.tsx
 * Purpose: The brand stamp: the difficulty score (or "Not rated" when the review gate is not verified) inside a stamp-red outline, turned a little, pressed once when it first comes
 *          into view. It is the one place stamp red marks the verdict. The score is set by code; this only draws it.
 * Exports: StampMark
 * Used by: components/verdict/Verdict.tsx
 */
import type { ReactElement } from "react";
import { useInView } from "@/hooks/useInView";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";
import { NOT_RATED, difficultyAriaLabel } from "@/utils/difficulty-rating";

type StampMarkProps = { score: number; isRated?: boolean; className?: string };

export function StampMark({ score, isRated = true, className }: StampMarkProps): ReactElement {
  const { ref, isInView } = useInView<HTMLDivElement>({ once: true });
  const isReduced = useReducedMotion();

  return (
    <div
      ref={ref}
      role="img"
      aria-label={difficultyAriaLabel(score, isRated)}
      className={cn(
        "flex size-20 shrink-0 flex-col items-center justify-center rounded-md border-2 border-stamp p-0.5 text-stamp",
        // The press animation ends turned by -8deg, so the static turn is only for the states without it.
        isReduced || !isInView ? "-rotate-[8deg]" : "animate-stamp",
        !isReduced && !isInView && "opacity-0",
        className,
      )}
    >
      <div
        aria-hidden
        className="flex size-full flex-col items-center justify-center rounded-sm border border-stamp leading-none"
      >
        <span className="text-[0.625rem] font-semibold tracking-widest uppercase">Stamp</span>
        {isRated ? (
          <span className="font-mono text-2xl font-semibold">{score}/5</span>
        ) : (
          <span className="text-center text-sm font-semibold">{NOT_RATED}</span>
        )}
      </div>
    </div>
  );
}
