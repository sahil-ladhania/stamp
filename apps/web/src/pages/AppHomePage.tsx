/**
 * File: AppHomePage.tsx
 * Purpose: App home route `/app`. Maps the `?state=` scenario to the library status and composes the sections.
 * Exports: AppHomePage
 * Used by: router.tsx
 */
import type { ReactElement } from "react";
import type { LibraryStatus } from "@/components/app-home/library-status";
import { LibrarySection } from "@/components/app-home/LibrarySection";
import { LiveResearchNote } from "@/components/app-home/LiveResearchNote";
import { LookupSection } from "@/components/app-home/LookupSection";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useMockScenario } from "@/hooks/useMockScenario";
import { LIBRARY_SUMMARIES } from "@/mocks/guides";
import { PAGE_SCENARIOS } from "@/mocks/scenarios";

export function AppHomePage(): ReactElement {
  useDocumentTitle("Look up an app");
  const { scenario } = useMockScenario(PAGE_SCENARIOS["app-home"]);
  const status: LibraryStatus =
    scenario === "loading" || scenario === "empty" || scenario === "error"
      ? scenario
      : "ready";

  return (
    <>
      <LookupSection key={scenario} scenario={scenario} />
      <LibrarySection status={status} guides={LIBRARY_SUMMARIES} />
      <LiveResearchNote />
    </>
  );
}
