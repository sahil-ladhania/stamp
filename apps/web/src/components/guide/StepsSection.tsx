/**
 * File: StepsSection.tsx
 * Purpose: Guide section 5: who does what. A count per actor, then every step as a card.
 * Exports: StepsSection
 * Used by: components/guide/GuideView.tsx
 */
import type { ReactElement } from "react";
import { PageSection } from "@/components/shared/PageSection";
import type { Step } from "@/mocks/types";
import { countActors } from "@/utils/actor";
import { ActorTag } from "./ActorTag";
import { MissingSection } from "./MissingSection";
import { StepCard } from "./StepCard";

type StepsSectionProps = { steps: readonly Step[]; isMissing: boolean };

export function StepsSection({
  steps,
  isMissing,
}: StepsSectionProps): ReactElement {
  return (
    <PageSection
      id="steps"
      title="Steps"
      description="Each step says who does it: the agent, you, or both."
    >
      {isMissing ? (
        <MissingSection />
      ) : (
        <>
          <ul
            aria-label="Steps by who does them"
            className="flex flex-wrap gap-x-6 gap-y-2"
          >
            {countActors(steps).map(({ actor, count }) => (
              <li key={actor} className="flex items-center gap-2">
                <ActorTag actor={actor} />
                <span className="text-data text-ink">{count}</span>
              </li>
            ))}
          </ul>
          <ol className="flex flex-col gap-4">
            {steps.map((step, index) => (
              <StepCard key={step.id} step={step} number={index + 1} />
            ))}
          </ol>
        </>
      )}
    </PageSection>
  );
}
