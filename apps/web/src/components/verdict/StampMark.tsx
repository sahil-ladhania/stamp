/**
 * File: StampMark.tsx
 * Purpose: The brand stamp: the difficulty score inside a stamp-red outline, turned a little, pressed once when it first comes
 *          into view. It is the one place stamp red marks the verdict. The score is set by code; this only draws it.
 * Exports: StampMark
 * Used by: components/verdict/Verdict.tsx
 */
import type { ReactElement } from "react";
import { useInView } from "@/hooks/useInView";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

type StampMarkProps = { score: number; className?: string };

export function StampMark({ score, className }: StampMarkProps): ReactElement {
  const { ref, isInView } = useInView<HTMLDivElement>({ once: true });
  const isReduced = useReducedMotion();

  return (
    <div
      ref={ref}
      role="img"
      aria-label={`Difficulty ${score} of 5`}
      className={cn(
        "flex size-20 shrink-0 -rotate-[8deg] flex-col items-center justify-center rounded-md border-2 border-stamp p-0.5 text-stamp",
        !isReduced && !isInView && "opacity-0",
        !isReduced && isInView && "animate-stamp",
        className,
      )}
    >
      <div
        aria-hidden
        className="flex size-full flex-col items-center justify-center rounded-sm border border-stamp leading-none"
      >
        <span className="text-[0.625rem] font-semibold tracking-widest uppercase">Stamp</span>
        <span className="font-mono text-2xl font-semibold">{score}/5</span>
      </div>
    </div>
  );
}
