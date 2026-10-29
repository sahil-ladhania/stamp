/**
 * File: StepVisualFrame.tsx
 * Purpose: The frame around one picture of the "How Stamp works" stepper. The picture is made of real interface pieces in a still
 *          state, so it is inert and hidden from assistive technology: the step's own text says the same thing.
 * Exports: StepVisualFrame
 * Used by: components/landing/StepVisualSearch.tsx, StepVisualTrace.tsx, StepVisualShare.tsx
 */
import type { ReactElement, ReactNode } from "react";

export function StepVisualFrame({ children }: { children: ReactNode }): ReactElement {
  return (
    <figure className="m-0 flex flex-col gap-2">
      <div inert aria-hidden className="rounded-md border border-rule bg-card p-4 tablet:p-6">
        {children}
      </div>
      <figcaption className="text-small text-ink-muted">Example</figcaption>
    </figure>
  );
}
