/**
 * File: PartialNotice.tsx
 * Purpose: Banner on a partial guide: which sections are Uncertain, and a button that researches the app again.
 * Exports: PartialNotice
 * Used by: components/guide/GuideView.tsx
 */
import type { ReactElement } from "react";
import { Button } from "@/components/ui/button";
import { useStartRun } from "@/hooks/useStartRun";
import { getApiErrorMessage } from "@/utils/error-messages";
import { formatList } from "@/utils/format-list";

type PartialNoticeProps = {
  sections: readonly string[];
  /** The guide's slug. The API normalises it to itself, so it names the same app. */
  slug: string;
};

export function PartialNotice({
  sections,
  slug,
}: PartialNoticeProps): ReactElement {
  const { start, isPending, error } = useStartRun();
  const lead = "Stamp saved what it found and marked the rest Uncertain";

  return (
    <section
      aria-labelledby="partial-heading"
      className="flex flex-col items-start gap-3 rounded-md border border-ink bg-card p-card"
    >
      <h2 id="partial-heading" className="text-card-title text-ink">
        This guide is partial
      </h2>
      <p className="text-body text-ink-muted">
        {sections.length > 0 ? `${lead}: ${formatList(sections)}.` : `${lead}.`}
      </p>
      <Button
        size="lg"
        disabled={isPending}
        onClick={() => void start(slug, { force: true })}
      >
        Retry run
      </Button>
      {error && (
        <p role="alert" className="text-small text-ink">
          {getApiErrorMessage(error)}
        </p>
      )}
    </section>
  );
}
