/**
 * File: LibraryHeader.tsx
 * Purpose: Top of App home: the title, one line, the search that starts a run, and one helper line for an app that is not in the
 *          library.
 * Exports: LibraryHeader
 * Used by: pages/AppHomePage.tsx
 */
import type { ReactElement } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { StartRunSearch } from "@/components/shared/StartRunSearch";
import { APP_SEARCH_INPUT_ID } from "./app-search-id";

export function LibraryHeader(): ReactElement {
  return (
    <PageContainer className="flex flex-col gap-6 py-12">
      <SectionHeading
        level={1}
        title="Look up an app"
        description="Search any app by name or website. Or open one of the library guides below."
      />
      <div className="flex max-w-2xl flex-col gap-2">
        <StartRunSearch size="lg" inputId={APP_SEARCH_INPUT_ID} placeholder="Search an app, like HubSpot" />
        <p className="text-small text-ink-muted">
          Not in the library? Any other app is researched live. You watch each search, and the guide gets its own link.
        </p>
      </div>
    </PageContainer>
  );
}
