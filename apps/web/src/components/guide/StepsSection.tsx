/**
 * File: StepsSection.tsx
 * Purpose: Guide section 3: who does what, as a numbered stepper. The first step is open. An Uncertain or empty section says so,
 *          and keeps whatever steps there are.
 * Exports: StepsSection
 * Used by: components/guide/GuideView.tsx
 */
import type { ReactElement } from "react";
import { UnknownValue } from "@/components/shared/UnknownValue";
import { PageSection } from "@/components/shared/PageSection";
import { Accordion } from "@/components/ui/accordion";
import type { Step } from "@/types/guide-model";
import { ActorSummary } from "./ActorSummary";
import { MissingSection } from "./MissingSection";
import { StepRow } from "./StepRow";

type StepsSectionProps = { steps: readonly Step[]; isMissing: boolean };

export function StepsSection({ steps, isMissing }: StepsSectionProps): ReactElement {
  return (
    <PageSection id="steps" title="Steps" description="Each step says who does it: the agent, you, or both.">
      {isMissing && <MissingSection />}
      {steps.length === 0 && !isMissing && <UnknownValue text="No steps found" />}
      {steps.length > 0 && (
        <>
          <ActorSummary steps={steps} />
          <Accordion type="single" collapsible defaultValue={steps[0]?.id} asChild>
            <ol className="flex flex-col">
              {steps.map((step, index) => (
                <StepRow key={step.id} step={step} number={index + 1} />
              ))}
            </ol>
          </Accordion>
        </>
      )}
    </PageSection>
  );
}
