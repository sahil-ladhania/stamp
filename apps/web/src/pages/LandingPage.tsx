/**
 * File: LandingPage.tsx
 * Purpose: Landing route `/`. Loads the library and the sample guide, and composes the hero and the sections.
 *          Anything the API cannot give (an empty library, a missing sample) is left out, never shown broken.
 * Exports: LandingPage
 * Used by: router.tsx
 */
import type { ReactElement } from "react";
import { ClosingBanner } from "@/components/landing/ClosingBanner";
import { EvidenceSection } from "@/components/landing/EvidenceSection";
import { Hero } from "@/components/landing/Hero";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { KindsOfHardSection } from "@/components/landing/KindsOfHardSection";
import { VerdictSection } from "@/components/landing/VerdictSection";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useGuide } from "@/hooks/useGuide";
import { useGuides } from "@/hooks/useGuides";
import { getLandingSample, sampleGuideOf } from "@/utils/landing-sample";
import { getLibraryStatus } from "@/utils/library-status";
import { mapGuide } from "@/utils/map-guide";

/** The library guide the landing page shows as a real example. */
const SAMPLE_SLUG = "hubspot";

export function LandingPage(): ReactElement {
  useDocumentTitle("OAuth readiness report");
  const library = useGuides();
  const sampleResult = useGuide(SAMPLE_SLUG);

  const guides = library.data ?? [];
  const libraryStatus = getLibraryStatus({
    isLoading: library.isLoading,
    hasError: library.error !== null,
    count: guides.length,
  });
  const sample = getLandingSample({
    isLoading: sampleResult.isLoading,
    guide: sampleResult.data ? mapGuide(sampleResult.data) : null,
  });

  return (
    <>
      <Hero
        sampleGuide={sampleGuideOf(sample)}
        exampleGuides={libraryStatus === "ready" ? guides : []}
      />
      <VerdictSection sample={sample} />
      <HowItWorksSection />
      <KindsOfHardSection status={libraryStatus} guides={guides} />
      <EvidenceSection sample={sample} />
      <ClosingBanner />
    </>
  );
}
