/**
 * File: LibrarySection.tsx
 * Purpose: App home library: heading, the difficulty sort toggle, the rule link and the list.
 * Exports: LibrarySection
 * Used by: pages/AppHomePage.tsx
 */
import type { GuideSummary } from "@stamp/schema";
import { useState, type ReactElement } from "react";
import { Link } from "react-router";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionHeading } from "@/components/shared/SectionHeading";
import type { ApiError } from "@/lib/api-error";
import type { LibraryStatus } from "@/utils/library-status";
import { sortByDifficulty, type SortOrder } from "@/utils/sort-guides";
import { LibraryList } from "./LibraryList";
import { SortToggle } from "./SortToggle";

type LibrarySectionProps = {
  status: LibraryStatus;
  guides: readonly GuideSummary[];
  error: ApiError | null;
  onRetry: () => void;
};

export function LibrarySection({
  status,
  guides,
  error,
  onRetry,
}: LibrarySectionProps): ReactElement {
  const [order, setOrder] = useState<SortOrder>("easiest");

  return (
    <section
      aria-labelledby="library-heading"
      className="border-t border-rule py-12"
    >
      <PageContainer className="flex flex-col gap-6">
        <SectionHeading
          id="library-heading"
          title="The library"
          description="Guides Stamp has already researched. The difficulty score comes from a fixed rule."
          aside={
            status === "ready" ? (
              <SortToggle value={order} onChange={setOrder} />
            ) : undefined
          }
        />
        <Link
          to="/how-we-verify#difficulty"
          className="self-start text-body text-sourced underline underline-offset-4"
        >
          Read how difficulty is scored
        </Link>
        {status === "ready" && (
          <p role="status" className="sr-only">
            {`Sorted ${order} first`}
          </p>
        )}
        <LibraryList
          status={status}
          guides={sortByDifficulty(guides, order)}
          error={error}
          onRetry={onRetry}
        />
      </PageContainer>
    </section>
  );
}
