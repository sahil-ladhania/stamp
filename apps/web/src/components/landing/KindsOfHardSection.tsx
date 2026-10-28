/**
 * File: KindsOfHardSection.tsx
 * Purpose: Landing section with the five library guides, one for each kind of hard.
 * Exports: KindsOfHardSection
 * Used by: pages/LandingPage.tsx
 */
import type { ReactElement } from "react";
import { Link } from "react-router";
import { Container } from "@/components/layout/Container";
import { AppCard } from "@/components/shared/AppCard";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { buttonVariants } from "@/components/ui/button-variants";
import { LIBRARY_SUMMARIES } from "@/mocks/library";

export function KindsOfHardSection(): ReactElement {
  return (
    <section
      aria-labelledby="kinds-heading"
      className="border-t border-rule py-12"
    >
      <Container size="wide" className="flex flex-col gap-8">
        <SectionHeading
          id="kinds-heading"
          title="Five ways an OAuth app gets hard"
          description="Each library guide is a different catch, from no review on GitHub to weeks of assessment on Gmail."
          aside={
            <Link
              to="/app"
              className={buttonVariants({ variant: "secondary" })}
            >
              Open the library
            </Link>
          }
        />
        <ul className="grid gap-4 tablet:grid-cols-2 desktop:grid-cols-3">
          {LIBRARY_SUMMARIES.map((guide) => (
            <li key={guide.slug}>
              <AppCard guide={guide} />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
