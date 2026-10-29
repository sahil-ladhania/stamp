/**
 * File: LibrarySection.tsx
 * Purpose: App home library: the heading, the difficulty sort toggle and the guides in all four states (table and cards when
 *          ready, loading, empty, error). It loads the stated times for the rows once the list is ready.
 * Exports: LibrarySection
 * Used by: pages/AppHomePage.tsx
 */
import type { GuideSummary } from "@stamp/schema";
import { useState, type ReactElement } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { useLibraryTimes } from "@/hooks/useLibraryTimes";
import type { ApiError } from "@/lib/api-error";
import type { LibraryStatus } from "@/utils/library-status";
import { sortByDifficulty, type SortOrder } from "@/utils/sort-guides";
import { LibraryCard } from "./LibraryCard";
import { LibraryEmptyState } from "./LibraryEmptyState";
import { LibraryError, LibraryLoading } from "./LibraryStates";
import { LibraryTable } from "./LibraryTable";
import { SortToggle } from "./SortToggle";

type LibrarySectionProps = {
  status: LibraryStatus;
  guides: readonly GuideSummary[];
  error: ApiError | null;
  onRetry: () => void;
};

export function LibrarySection({ status, guides, error, onRetry }: LibrarySectionProps): ReactElement {
  const [order, setOrder] = useState<SortOrder>("easiest");
  const sorted = sortByDifficulty(guides, order);
  const { times, isLoading: isLoadingTimes } = useLibraryTimes(status === "ready" ? guides.map((guide) => guide.slug) : []);

  return (
    <section aria-labelledby="library-heading" className="border-t border-rule py-12">
      <PageContainer className="flex flex-col gap-6">
        <SectionHeading
          id="library-heading"
          title="The library"
          description="Guides Stamp has already researched. A fixed rule sets the difficulty score; a guide whose review gate is not verified is Not rated and comes last."
          aside={status === "ready" ? <SortToggle value={order} onChange={setOrder} /> : undefined}
        />
        {status === "ready" && (
          <>
            <p role="status" className="sr-only">{`Sorted ${order} first`}</p>
            <LibraryTable guides={sorted} times={times} isLoadingTimes={isLoadingTimes} />
            <ul className="flex flex-col gap-3 tablet:hidden">
              {sorted.map((guide) => (
                <li key={guide.slug}>
                  <LibraryCard guide={guide} times={times?.[guide.slug] ?? null} isLoadingTimes={isLoadingTimes} />
                </li>
              ))}
            </ul>
          </>
        )}
        {status === "loading" && <LibraryLoading />}
        {status === "empty" && <LibraryEmptyState />}
        {status === "error" && <LibraryError error={error} onRetry={onRetry} />}
      </PageContainer>
    </section>
  );
}
