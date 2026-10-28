/**
 * File: StepVisual.tsx
 * Purpose: Picks the picture for a step of the stepper.
 * Exports: StepVisual
 * Used by: components/landing/HowItWorksStepper.tsx
 */
import type { ReactElement } from "react";
import type { HowStep } from "./how-it-works-steps";
import { StepVisualSearch } from "./StepVisualSearch";
import { StepVisualShare } from "./StepVisualShare";
import { StepVisualTrace } from "./StepVisualTrace";

export function StepVisual({ step }: { step: HowStep }): ReactElement {
  switch (step.id) {
    case "search":
      return <StepVisualSearch />;
    case "research":
      return <StepVisualTrace />;
    case "share":
      return <StepVisualShare />;
  }
}
