/**
 * File: LibrarySection.tsx
 * Purpose: App home library: heading, the difficulty sort toggle, the rule link and the list.
 * Exports: LibrarySection
 * Used by: pages/AppHomePage.tsx
 */
import { useState, type ReactElement } from "react";
import { Link } from "react-router";
import { Container } from "@/components/layout/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import type { GuideSummary } from "@/mocks/types";
import { sortByDifficulty, type SortOrder } from "@/utils/sort-guides";
import type { LibraryStatus } from "./library-status";
import { LibraryList } from "./LibraryList";
import { SortToggle } from "./SortToggle";

type LibrarySectionProps = {
  status: LibraryStatus;
  guides: readonly GuideSummary[];
};

export function LibrarySection({
  status,
  guides,
}: LibrarySectionProps): ReactElement {
  const [order, setOrder] = useState<SortOrder>("easiest");

  return (
    <section
      aria-labelledby="library-heading"
      className="border-t border-rule py-12"
    >
      <Container className="flex flex-col gap-6">
        <SectionHeading
          id="library-heading"
          title="The library"
          description="One guide for each kind of hard. The difficulty score comes from a fixed rule."
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
        <LibraryList status={status} guides={sortByDifficulty(guides, order)} />
      </Container>
    </section>
  );
}
