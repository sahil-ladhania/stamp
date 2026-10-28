/**
 * File: AppHomePage.tsx
 * Purpose: App home route `/app`. Loads the library and composes the header with the search and the library.
 * Exports: AppHomePage
 * Used by: router.tsx
 */
import type { ReactElement } from "react";
import { LibraryHeader } from "@/components/app-home/LibraryHeader";
import { LibrarySection } from "@/components/app-home/LibrarySection";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useGuides } from "@/hooks/useGuides";
import { getLibraryStatus } from "@/utils/library-status";

export function AppHomePage(): ReactElement {
  useDocumentTitle("Look up an app");
  const { data, error, isLoading, reload } = useGuides();
  const guides = data ?? [];
  const status = getLibraryStatus({ isLoading, hasError: error !== null, count: guides.length });

  return (
    <>
      <LibraryHeader />
      <LibrarySection status={status} guides={guides} error={error} onRetry={reload} />
    </>
  );
}
