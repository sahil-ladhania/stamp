/**
 * File: HowStepText.tsx
 * Purpose: The words of one step of the stepper: its number, title and text, and for the research step the note on who checks
 *          the facts. Used by both forms of the stepper, so the words never differ.
 * Exports: HowStepText
 * Used by: components/landing/HowItWorksStepper.tsx
 */
import type { ReactElement } from "react";
import { Callout } from "@/components/shared/Callout";
import { cn } from "@/lib/utils";
import type { HowStep } from "./how-it-works-steps";

type HowStepTextProps = {
  step: HowStep;
  index: number;
  /** False dims the title only, so the text keeps its contrast. The plain list shows every step as active. */
  isActive?: boolean;
};

export function HowStepText({ step, index, isActive = true }: HowStepTextProps): ReactElement {
  return (
    <div className="flex flex-col gap-2">
      <span aria-hidden className={cn("font-mono text-data", isActive ? "text-ink" : "text-ink-muted")}>
        {index + 1}
      </span>
      <h3 className={cn("text-card-title motion-safe:transition-colors motion-safe:duration-200", isActive ? "text-ink" : "text-ink-muted")}>
        {step.title}
      </h3>
      <p className="text-body text-ink-muted">{step.body}</p>
      {step.id === "research" && (
        <Callout className="mt-2">The model drafts the facts. Code checks every quote and sets the score.</Callout>
      )}
    </div>
  );
}
