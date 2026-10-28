/**
 * File: PageSection.tsx
 * Purpose: Shell for one section of a long page: anchor id, hairline, heading and a padded content column.
 * Exports: PageSection
 * Used by: every section in components/verify/ and components/guide/
 */
import type { ReactElement, ReactNode } from "react";
import { Container } from "@/components/layout/Container";
import { SectionHeading } from "./SectionHeading";

type PageSectionProps = {
  /** The anchor id, for example `labels` for `#labels`. */
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
};

/** `scroll-mt-6` keeps the heading clear of the top edge after an anchor jump. */
export function PageSection({
  id,
  title,
  description,
  children,
}: PageSectionProps): ReactElement {
  const headingId = `${id}-heading`;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="scroll-mt-6 border-t border-rule py-12"
    >
      <Container className="flex flex-col gap-8">
        <SectionHeading
          id={headingId}
          title={title}
          description={description}
        />
        {children}
      </Container>
    </section>
  );
}
