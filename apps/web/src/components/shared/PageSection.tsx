/**
 * File: PageSection.tsx
 * Purpose: Shell for one section of a long page: anchor id, hairline, heading and a content column. It has no container of
 *          its own: the page puts its sections inside the one page frame, beside the section navigation.
 * Exports: PageSection
 * Used by: every section in components/verify/ and components/guide/
 */
import type { ReactElement, ReactNode } from "react";
import { SectionHeading } from "./SectionHeading";

type PageSectionProps = {
  /** The anchor id, for example `labels` for `#labels`. */
  id: string;
  title: string;
  description?: string;
  /** A right-side action, such as a link. */
  aside?: ReactNode;
  children: ReactNode;
};

/** `scroll-mt-6` keeps the heading clear of the top edge after an anchor jump. */
export function PageSection({
  id,
  title,
  description,
  aside,
  children,
}: PageSectionProps): ReactElement {
  const headingId = `${id}-heading`;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="flex scroll-mt-24 flex-col gap-6 border-t border-rule py-10"
    >
      <SectionHeading
        id={headingId}
        title={title}
        description={description}
        aside={aside}
      />
      {children}
    </section>
  );
}
