/**
 * File: LookupSection.tsx
 * Purpose: Top of App home: heading and the search that starts a run.
 * Exports: LookupSection
 * Used by: pages/AppHomePage.tsx
 */
import type { ReactElement } from "react";
import { Container } from "@/components/layout/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { StartRunSearch } from "@/components/shared/StartRunSearch";
import { APP_SEARCH_INPUT_ID } from "./app-search-id";

export function LookupSection(): ReactElement {
  return (
    <Container className="flex flex-col gap-6 py-12">
      <SectionHeading
        level={1}
        title="Look up an app"
        description="Search any app by name or website. Or open one of the library guides, sorted by difficulty."
      />
      <StartRunSearch
        size="lg"
        inputId={APP_SEARCH_INPUT_ID}
        placeholder="Search an app, like HubSpot"
      />
    </Container>
  );
}
