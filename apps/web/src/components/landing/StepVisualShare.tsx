/**
 * File: StepVisualShare.tsx
 * Purpose: Step 3 picture: a guide share card with its link and the Copy link button, in a still state.
 * Exports: StepVisualShare
 * Used by: components/landing/HowItWorksStepper.tsx
 */
import type { ReactElement } from "react";
import { Link2 } from "lucide-react";
import { AppIdentity } from "@/components/shared/AppIdentity";
import { buttonVariants } from "@/components/ui/button-variants";
import { StepVisualFrame } from "./StepVisualFrame";

export function StepVisualShare(): ReactElement {
  return (
    <StepVisualFrame>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <AppIdentity name="HubSpot" slug="hubspot" size="md" />
          <p className="text-small text-ink-muted">OAuth readiness report, with the date and every source.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="min-w-0 flex-1 basis-40 truncate rounded-md border border-rule bg-paper px-3 py-2 font-mono text-data text-ink">
            /g/hubspot
          </span>
          <span className={buttonVariants({ variant: "secondary" })}>
            <Link2 aria-hidden className="size-4" />
            Copy link
          </span>
        </div>
      </div>
    </StepVisualFrame>
  );
}
