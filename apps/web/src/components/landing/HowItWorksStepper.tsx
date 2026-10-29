/**
 * File: HowItWorksStepper.tsx
 * Purpose: The three steps from search to a shared guide. On a wide screen without reduced motion it is scroll-driven: a sticky list
 *          of the steps on the left, the active one marked and a line filling as you scroll, one picture per step on the right.
 *          Everywhere else it is a plain list with each picture under its step. Nothing here loops or jumps on its own.
 * Exports: HowItWorksStepper
 * Used by: components/landing/HowItWorksSection.tsx
 */
import type { ReactElement } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useScrollSteps } from "@/hooks/useScrollSteps";
import { HOW_STEPS } from "./how-it-works-steps";
import { HowStepText } from "./HowStepText";
import { StepVisual } from "./StepVisual";

const PANEL_IDS = HOW_STEPS.map((step) => `how-panel-${step.id}`);

function PlainSteps(): ReactElement {
  return (
    <ol className="flex flex-col gap-10">
      {HOW_STEPS.map((step, index) => (
        <li key={step.id} className="grid gap-6 desktop:grid-cols-12 desktop:items-center">
          <div className="min-w-0 desktop:col-span-5">
            <HowStepText step={step} index={index} />
          </div>
          <div className="min-w-0 desktop:col-span-7">
            <StepVisual step={step} />
          </div>
        </li>
      ))}
    </ol>
  );
}

function ScrollSteps(): ReactElement {
  const { activeIndex, progress } = useScrollSteps(PANEL_IDS, true);

  return (
    <div className="grid grid-cols-12 items-start gap-12">
      <div className="sticky top-24 col-span-5 flex gap-6 self-start">
        <div aria-hidden className="relative w-0.5 shrink-0 self-stretch bg-rule">
          <div
            className="absolute top-0 left-0 w-full bg-ink motion-safe:transition-[height] motion-safe:duration-200"
            style={{ height: `${Math.round(progress * 100)}%` }}
          />
        </div>
        <ol className="flex flex-col gap-8">
          {HOW_STEPS.map((step, index) => (
            <li key={step.id} aria-current={index === activeIndex ? "step" : undefined}>
              <HowStepText step={step} index={index} isActive={index === activeIndex} />
            </li>
          ))}
        </ol>
      </div>
      <div className="col-span-7 flex flex-col">
        {HOW_STEPS.map((step, index) => (
          <div key={step.id} id={PANEL_IDS[index]} className="flex min-h-[50svh] items-center">
            <div className="w-full">
              <StepVisual step={step} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HowItWorksStepper(): ReactElement {
  const isWide = useMediaQuery("(min-width: 64rem)");
  const isReduced = useReducedMotion();
  return isWide && !isReduced ? <ScrollSteps /> : <PlainSteps />;
}
