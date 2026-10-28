/**
 * File: HeroPoster.tsx
 * Purpose: Code-built fallback for the demo video: the HubSpot verdict plus a way forward. Shown when the video
 *          is missing or fails to load. Follows the theme through tokens, so it needs no image.
 * Exports: HeroPoster
 * Used by: components/landing/HeroVideo.tsx
 */
import type { ReactElement } from "react";
import { Link } from "react-router";
import { VerdictStamp } from "@/components/guide/VerdictStamp";
import { buttonVariants } from "@/components/ui/button-variants";
import { hubspotGuide } from "@/mocks/guides/hubspot";

export function HeroPoster(): ReactElement {
  return (
    <div className="flex aspect-video flex-col justify-center gap-4 rounded-md border border-rule bg-paper p-4 tablet:p-6">
      <VerdictStamp guide={hubspotGuide} size="sm" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-small text-ink">
          The video did not load. Open the HubSpot guide to see the same
          verdict.
        </p>
        <Link
          to="/g/hubspot"
          className={buttonVariants({ variant: "secondary", size: "sm" })}
        >
          Open the HubSpot guide
        </Link>
      </div>
    </div>
  );
}
