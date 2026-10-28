/**
 * File: LiveResearchNote.tsx
 * Purpose: Closing note on App home: what happens for an app that is not in the library.
 * Exports: LiveResearchNote
 * Used by: pages/AppHomePage.tsx
 */
import type { ReactElement } from "react";
import { Link } from "react-router";
import { Container } from "@/components/layout/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";

export function LiveResearchNote(): ReactElement {
  return (
    <section
      aria-labelledby="live-note-heading"
      className="border-t border-rule py-12"
    >
      <Container className="flex flex-col items-start gap-4">
        <SectionHeading
          id="live-note-heading"
          title="Not on the list?"
          description="Any other app is researched live. You watch each search and each page it reads, and the guide gets its own link."
        />
        <Link
          to="/how-we-verify"
          className="text-body text-sourced underline underline-offset-4"
        >
          Read how we verify
        </Link>
      </Container>
    </section>
  );
}
