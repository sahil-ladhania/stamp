/**
 * File: StepVisualSearch.tsx
 * Purpose: Step 1 picture: the real search box with an app typed in.
 * Exports: StepVisualSearch
 * Used by: components/landing/HowItWorksStepper.tsx
 */
import type { ReactElement } from "react";
import { SearchBar } from "@/components/shared/SearchBar";
import { StepVisualFrame } from "./StepVisualFrame";

export function StepVisualSearch(): ReactElement {
  return (
    <StepVisualFrame>
      <SearchBar size="lg" defaultValue="HubSpot" onSubmit={() => undefined} />
    </StepVisualFrame>
  );
}
