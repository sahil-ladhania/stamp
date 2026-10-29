/**
 * File: StepVisualTrace.tsx
 * Purpose: Step 2 picture: a short run, with the real stage rows and trace rows in a still state, a stage ticking and the
 *          latest events. It shows the shape of the run page, not a real run.
 * Exports: StepVisualTrace
 * Used by: components/landing/HowItWorksStepper.tsx
 */
import type { ReactElement } from "react";
import { StageItem } from "@/components/run/StageItem";
import { TraceRow } from "@/components/run/TraceRow";
import { SAMPLE_STAGES, SAMPLE_TRACE } from "./step-visual-trace-data";
import { StepVisualFrame } from "./StepVisualFrame";

export function StepVisualTrace(): ReactElement {
  return (
    <StepVisualFrame>
      <div className="grid gap-4 tablet:grid-cols-2 tablet:gap-6">
        <ol className="flex flex-col divide-y divide-rule">
          {SAMPLE_STAGES.map((stage) => (
            <StageItem key={stage.stage} stage={stage} />
          ))}
        </ol>
        <ol className="flex flex-col divide-y divide-rule border-t border-rule pt-2 tablet:border-t-0 tablet:border-l tablet:pt-0 tablet:pl-6">
          {SAMPLE_TRACE.map((item) => (
            <TraceRow key={item.id} item={item} />
          ))}
        </ol>
      </div>
    </StepVisualFrame>
  );
}
