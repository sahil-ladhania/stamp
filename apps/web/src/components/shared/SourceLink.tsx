/**
 * File: SourceLink.tsx
 * Purpose: A link to a claim's source page that opens in a new tab and says so to screen readers.
 * Exports: SourceLink
 * Used by: components/landing/EvidenceSection.tsx, components/guide/ConflictCard.tsx
 */
import type { ReactElement } from "react";
import { cn } from "@/lib/utils";
import type { Source } from "@/mocks/types";

type SourceLinkProps = {
  /** Only the address and the link text are needed, so a bare URL can be linked too. */
  source: Pick<Source, "url" | "title">;
  className?: string;
};

export function SourceLink({
  source,
  className,
}: SourceLinkProps): ReactElement {
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "text-small text-sourced underline underline-offset-4",
        className,
      )}
    >
      {source.title}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
