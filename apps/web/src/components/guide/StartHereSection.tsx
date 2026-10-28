/**
 * File: StartHereSection.tsx
 * Purpose: Guide section 3: the next step and the top blocker side by side, so the first action is clear.
 * Exports: StartHereSection
 * Used by: components/guide/GuideView.tsx
 */
import type { ReactElement } from "react";
import { PageSection } from "@/components/shared/PageSection";
import type { Blocker, Step } from "@/types/guide-model";
import { NextStepCard } from "./NextStepCard";
import { TopBlockerCard } from "./TopBlockerCard";

type StartHereSectionProps = {
  step: Step | undefined;
  blocker: Blocker | undefined;
};

export function StartHereSection({
  step,
  blocker,
}: StartHereSectionProps): ReactElement {
  return (
    <PageSection id="start" title="Next step and top blocker">
      <div className="grid gap-4 desktop:grid-cols-2">
        <NextStepCard step={step} />
        <TopBlockerCard blocker={blocker} />
      </div>
    </PageSection>
  );
}
