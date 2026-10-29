/**
 * File: HowItWorksSection.tsx
 * Purpose: Landing section with the three steps from search to a shared guide.
 * Exports: HowItWorksSection
 * Used by: pages/LandingPage.tsx
 */
import type { ReactElement } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { HowItWorksStepper } from "./HowItWorksStepper";

export function HowItWorksSection(): ReactElement {
  return (
    <section aria-labelledby="how-heading" className="border-t border-rule py-12">
      <PageContainer className="flex flex-col gap-8">
        <SectionHeading id="how-heading" title="How Stamp works" description="Three steps, from a search to a link you can send." />
        <HowItWorksStepper />
      </PageContainer>
    </section>
  );
}
