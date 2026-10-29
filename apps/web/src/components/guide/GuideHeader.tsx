/**
 * File: GuideHeader.tsx
 * Purpose: Top of a guide: the app as the title with Copy link beside it, "Researched as: <product> (<domain>)", the headline cut to a few lines with its label, and
 *          one quiet line of facts: library or live, the as-of date and how many claims are sourced.
 * Exports: GuideHeader
 * Used by: components/guide/GuideView.tsx
 */
import type { GuideMode } from "@stamp/schema";
import type { ReactElement } from "react";
import { ClaimEvidence } from "@/components/evidence/ClaimEvidence";
import { AppIdentity } from "@/components/shared/AppIdentity";
import { ClampedText } from "@/components/shared/ClampedText";
import type { Guide } from "@/types/guide-model";
import { claimSummary } from "@/utils/claim-summary";
import { formatAsOf } from "@/utils/format-date";
import { researchedAs } from "@/utils/researched-as";
import { CopyLinkButton } from "./CopyLinkButton";

const MODE_LABEL: Record<GuideMode, string> = {
  library: "Library guide",
  live: "Live guide",
};

export function GuideHeader({ guide }: { guide: Guide }): ReactElement {
  return (
    <header className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="min-w-0 text-page-title text-ink">
          <AppIdentity name={guide.appName} slug={guide.slug} size="lg" />
        </h1>
        <CopyLinkButton slug={guide.slug} />
      </div>
      {/* Which product and domain the run took the app to be, so a wrong identity is visible at a glance. */}
      <p className="-mt-2 text-small text-ink-muted">{researchedAs(guide)}</p>
      {/* The headline is a claim, so it carries its label like every other claim. */}
      <div className="flex max-w-prose flex-col items-start gap-2">
        <ClampedText text={guide.headline} max={200} className="text-card-title font-normal text-ink" />
        <ClaimEvidence claim={guide.summary} />
      </div>
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-small text-ink-muted">
        <span>{MODE_LABEL[guide.mode]}</span>
        <span aria-hidden>·</span>
        <span>As of {formatAsOf(guide.asOf)}</span>
        <span aria-hidden>·</span>
        <span>{claimSummary(guide.claims).text}</span>
      </p>
    </header>
  );
}
