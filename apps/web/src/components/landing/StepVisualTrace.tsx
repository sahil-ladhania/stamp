/**
 * File: StepVisualTrace.tsx
 * Purpose: Step 2 picture: a short run built from the real stage group header and event rows in a still state, one group open with its
 *          latest events. It shows the shape of the run page, not a real run.
 * Exports: StepVisualTrace
 * Used by: components/landing/HowItWorksStepper.tsx
 */
import type { ReactElement } from "react";
import { EventRow } from "@/components/run/EventRow";
import { StageGroupHeader } from "@/components/run/StageGroupHeader";
import { SAMPLE_GROUPS } from "./step-visual-trace-data";
import { StepVisualFrame } from "./StepVisualFrame";

export function StepVisualTrace(): ReactElement {
  return (
    <StepVisualFrame>
      <ol className="flex flex-col divide-y divide-rule">
        {SAMPLE_GROUPS.map((group) => {
          const isOpen = group.status === "running";
          return (
            <li key={group.stage}>
              <div className="group" data-state={isOpen ? "open" : "closed"}>
                <StageGroupHeader group={group} isExpandable={group.items.length > 0} />
              </div>
              {isOpen && (
                <ul className="flex flex-col gap-2 pb-3 pl-7">
                  {group.items.map((item) => (
                    <EventRow key={item.id} item={item} />
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ol>
    </StepVisualFrame>
  );
}
