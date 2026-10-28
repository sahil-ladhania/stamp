/**
 * File: HeroPoster.tsx
 * Purpose: Code-built fallback for the demo video: a real verdict plus a way forward, or plain text when there is no
 *          sample guide. Shown when the video is missing or fails to load. Follows the theme through tokens, so it needs no image.
 * Exports: HeroPoster
 * Used by: components/landing/HeroVideo.tsx
 */
import type { ReactElement } from "react";
import { Link } from "react-router";
import { VerdictStamp } from "@/components/guide/VerdictStamp";
import { buttonVariants } from "@/components/ui/button-variants";
import type { Guide } from "@/types/guide-model";

/** `guide` is the sample guide from the API. Null while it loads, or when the library does not have it. */
export function HeroPoster({ guide }: { guide: Guide | null }): ReactElement {
  return (
    <div className="flex aspect-video flex-col justify-center gap-4 rounded-md border border-rule bg-paper p-4 tablet:p-6">
      {guide && <VerdictStamp guide={guide} size="sm" />}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-small text-ink">
          {guide
            ? `The video did not load. Open the ${guide.appName} guide to see the same verdict.`
            : "The video did not load. Search for an app to see its verdict."}
        </p>
        <Link
          to={guide ? `/g/${guide.slug}` : "/app"}
          className={buttonVariants({ variant: "secondary", size: "sm" })}
        >
          {guide ? `Open the ${guide.appName} guide` : "Search for an app"}
        </Link>
      </div>
    </div>
  );
}
