/**
 * File: Hero.tsx
 * Purpose: Landing hero: fills the first screen. The problem and search on the left, the demo video on the right, wider on a big
 *          screen and running to the page edge. The example chips show only when the library has guides.
 * Exports: Hero
 * Used by: pages/LandingPage.tsx
 */
import type { GuideSummary } from "@stamp/schema";
import type { ReactElement } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { ExampleApps } from "@/components/shared/ExampleApps";
import { StartRunSearch } from "@/components/shared/StartRunSearch";
import type { Guide } from "@/types/guide-model";
import { HeroVideo } from "./HeroVideo";
import { ScrollCue } from "./ScrollCue";

type HeroProps = {
  /** The sample guide for the video's fallback poster. Null when there is none. */
  sampleGuide: Guide | null;
  /** Library guides to link as examples. Empty while loading, on failure, or when the library has none. */
  exampleGuides: readonly GuideSummary[];
};

// The media runs to the right edge of the page from 80rem up: it takes back the space outside the 70rem frame and its gutter.
const BLEED =
  "min-[80rem]:-mr-[calc((100vw_-_70rem)/2_+_1.5rem)] min-[80rem]:[&>*]:rounded-r-none min-[80rem]:[&>*]:border-r-0";

export function Hero({ sampleGuide, exampleGuides }: HeroProps): ReactElement {
  return (
    <section
      aria-labelledby="hero-heading"
      className="flex min-h-[calc(100svh-4rem)] flex-col overflow-x-clip"
    >
      <PageContainer className="grid flex-1 content-center gap-12 py-12 desktop:grid-cols-12 desktop:items-center">
        <div className="flex flex-col gap-6 desktop:col-span-5">
          <h1
            id="hero-heading"
            className="text-page-title tracking-tight text-balance text-ink tablet:text-display"
          >
            Know what it takes to get your OAuth app stamped.
          </h1>
          <p className="text-card-title font-normal text-ink-muted">
            See if it takes an hour or six weeks, and what will block approval.
          </p>
          <StartRunSearch size="lg" placeholder="Search an app, like HubSpot" />
          <div className="flex flex-col gap-3">
            {exampleGuides.length > 0 && (
              <ExampleApps apps={exampleGuides} label="Try:" max={5} />
            )}
            <p className="text-small text-ink-muted">
              An app with no guide yet is researched live. You watch each
              search.
            </p>
          </div>
        </div>
        <div className={`desktop:col-span-7 ${BLEED}`}>
          <HeroVideo sampleGuide={sampleGuide} />
        </div>
      </PageContainer>
      <ScrollCue to="#sample" />
    </section>
  );
}
