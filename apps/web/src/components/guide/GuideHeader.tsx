/**
 * File: GuideHeader.tsx
 * Purpose: Top of a guide: app name, headline, kind of hard, as-of date, Copy link and the difficulty breakdown.
 * Exports: GuideHeader
 * Used by: components/guide/GuideView.tsx
 */
import type { ReactElement } from "react";
import { SectionHeading } from "@/components/shared/SectionHeading";
import type { Guide, GuideMode } from "@/mocks/types";
import { ARCHETYPE_LABEL } from "@/utils/archetype";
import { formatAsOf } from "@/utils/format-date";
import { CopyLinkButton } from "./CopyLinkButton";
import { DifficultyBreakdown } from "./DifficultyBreakdown";

const MODE_LABEL: Record<GuideMode, string> = {
  library: "Library guide",
  live: "Live guide",
};

export function GuideHeader({ guide }: { guide: Guide }): ReactElement {
  return (
    <header className="flex flex-col gap-4">
      <SectionHeading
        level={1}
        title={guide.appName}
        description={guide.headline}
        aside={<CopyLinkButton slug={guide.slug} />}
      />
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-small text-ink-muted">
        <span className="text-data text-ink">
          {ARCHETYPE_LABEL[guide.archetype]}
        </span>
        <span aria-hidden>·</span>
        <span>As of {formatAsOf(guide.asOf)}</span>
        <span aria-hidden>·</span>
        <span>{MODE_LABEL[guide.mode]}</span>
      </p>
      <DifficultyBreakdown difficulty={guide.difficulty} />
    </header>
  );
}
