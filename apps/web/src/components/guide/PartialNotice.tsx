/**
 * File: PartialNotice.tsx
 * Purpose: Banner on a partial guide: which sections are Uncertain, and a way to run again.
 * Exports: PartialNotice
 * Used by: components/guide/GuideView.tsx
 */
import type { ReactElement } from "react";
import { Link } from "react-router";
import { buttonVariants } from "@/components/ui/button-variants";
import { MOCK_RUN_ID } from "@/mocks/run-events";
import { formatList } from "@/utils/format-list";

export function PartialNotice({
  sections,
}: {
  sections: readonly string[];
}): ReactElement {
  return (
    <section
      aria-labelledby="partial-heading"
      className="flex flex-col items-start gap-3 rounded-md border border-ink bg-card p-card"
    >
      <h2 id="partial-heading" className="text-card-title text-ink">
        This guide is partial
      </h2>
      <p className="text-body text-ink-muted">
        {`Stamp saved what it found and marked the rest Uncertain: ${formatList(sections)}.`}
      </p>
      <Link
        to={`/run/${MOCK_RUN_ID}`}
        className={buttonVariants({ size: "lg" })}
      >
        Retry run
      </Link>
    </section>
  );
}
