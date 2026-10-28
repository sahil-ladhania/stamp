/**
 * File: ClosingSearchSection.tsx
 * Purpose: Landing closing section: a second search entry point after the visitor has read the page.
 * Exports: ClosingSearchSection
 * Used by: pages/LandingPage.tsx
 */
import type { ReactElement } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { StartRunSearch } from "@/components/shared/StartRunSearch";

export function ClosingSearchSection(): ReactElement {
  return (
    <section
      aria-labelledby="closing-heading"
      className="border-t border-rule py-12"
    >
      <PageContainer
        className="grid gap-8 desktop:grid-cols-12 desktop:items-center"
      >
        <SectionHeading
          id="closing-heading"
          title="Get a guide for any app"
          description="Search any app. If it has no guide yet, the agent researches it live."
          className="desktop:col-span-5"
        />
        <StartRunSearch className="desktop:col-span-7" />
      </PageContainer>
    </section>
  );
}
