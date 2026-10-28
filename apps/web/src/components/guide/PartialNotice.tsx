/**
 * File: PartialNotice.tsx
 * Purpose: Note on a partial guide, under the verdict: which sections are Uncertain, and a button that researches the app again.
 * Exports: PartialNotice
 * Used by: components/guide/GuideView.tsx
 */
import type { ReactElement } from "react";
import { Callout } from "@/components/shared/Callout";
import { Button } from "@/components/ui/button";
import { useStartRun } from "@/hooks/useStartRun";
import { getApiErrorMessage } from "@/utils/error-messages";
import { formatList } from "@/utils/format-list";

type PartialNoticeProps = {
  sections: readonly string[];
  /** The guide's slug. The API normalises it to itself, so it names the same app. */
  slug: string;
};

export function PartialNotice({ sections, slug }: PartialNoticeProps): ReactElement {
  const { start, isPending, error } = useStartRun();
  const lead = "Stamp saved what it found and marked the rest Uncertain";

  return (
    <Callout
      variant="warning"
      title="This guide is partial"
      actions={
        <Button disabled={isPending} onClick={() => void start(slug, { force: true })}>
          Retry run
        </Button>
      }
    >
      <p className="text-ink-muted">{sections.length > 0 ? `${lead}: ${formatList(sections)}.` : `${lead}.`}</p>
      {error && (
        <p role="alert" className="mt-2 text-small text-ink">
          {getApiErrorMessage(error)}
        </p>
      )}
    </Callout>
  );
}
