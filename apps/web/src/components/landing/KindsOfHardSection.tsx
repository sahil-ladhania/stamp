/**
 * File: KindsOfHardSection.tsx
 * Purpose: Landing section that previews the library: a few guides, each a different kind of hard. It is left out
 *          when the library is empty or did not load, so the page never shows a broken section.
 * Exports: KindsOfHardSection
 * Used by: pages/LandingPage.tsx
 */
import type { GuideSummary } from "@stamp/schema";
import type { ReactElement } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { AppCard } from "@/components/shared/AppCard";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { TextLink } from "@/components/shared/TextLink";
import type { LibraryStatus } from "@/utils/library-status";

const MAX_PREVIEW = 6;
const SKELETON_CARDS = [1, 2, 3] as const;

type KindsOfHardSectionProps = {
  status: LibraryStatus;
  guides: readonly GuideSummary[];
};

export function KindsOfHardSection({
  status,
  guides,
}: KindsOfHardSectionProps): ReactElement | null {
  if (status === "empty" || status === "error") return null;

  return (
    <section
      aria-labelledby="kinds-heading"
      className="border-t border-rule py-12"
    >
      <PageContainer className="flex flex-col gap-8">
        <SectionHeading
          id="kinds-heading"
          title="Guides in the library"
          description="Each library guide shows a different kind of hard, from no review to weeks of assessment."
        />
        {status === "loading" ? (
          <div aria-busy="true" className="flex flex-col gap-3">
            <p role="status" className="sr-only">
              Loading the library
            </p>
            <ul
              aria-hidden
              className="grid gap-4 tablet:grid-cols-2 desktop:grid-cols-3"
            >
              {SKELETON_CARDS.map((card) => (
                <li
                  key={card}
                  className="h-36 rounded-md border border-rule bg-card"
                />
              ))}
            </ul>
          </div>
        ) : (
          <ul className="grid gap-4 tablet:grid-cols-2 desktop:grid-cols-3">
            {guides.slice(0, MAX_PREVIEW).map((guide) => (
              <li key={guide.slug}>
                <AppCard guide={guide} />
              </li>
            ))}
          </ul>
        )}
        <TextLink to="/app">Open the library</TextLink>
      </PageContainer>
    </section>
  );
}
