/**
 * File: ClosingSearchSection.tsx
 * Purpose: Landing closing section: a second search entry point after the visitor has read the page.
 * Exports: ClosingSearchSection
 * Used by: pages/LandingPage.tsx
 */
import type { ReactElement } from "react";
import { Container } from "@/components/layout/Container";
import { SearchBar } from "@/components/shared/SearchBar";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { useMockSearch } from "@/hooks/useMockSearch";

export function ClosingSearchSection(): ReactElement {
  const { submit } = useMockSearch();

  return (
    <section
      aria-labelledby="closing-heading"
      className="border-t border-rule py-12"
    >
      <Container
        size="wide"
        className="grid gap-8 desktop:grid-cols-12 desktop:items-center"
      >
        <SectionHeading
          id="closing-heading"
          title="Get a guide for any app"
          description="Search any app. If it is not in the library, the agent researches it live."
          className="desktop:col-span-5"
        />
        <SearchBar onSubmit={submit} className="desktop:col-span-7" />
      </Container>
    </section>
  );
}
