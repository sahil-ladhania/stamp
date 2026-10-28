/**
 * File: LandingPage.tsx
 * Purpose: Landing route `/`. Loads the sample guide and composes the hero and the five sections.
 * Exports: LandingPage
 * Used by: router.tsx
 */
import type { ReactElement } from "react";
import { ClosingSearchSection } from "@/components/landing/ClosingSearchSection";
import { EvidenceSection } from "@/components/landing/EvidenceSection";
import { Hero } from "@/components/landing/Hero";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { KindsOfHardSection } from "@/components/landing/KindsOfHardSection";
import { VerdictSection } from "@/components/landing/VerdictSection";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useGuide } from "@/hooks/useGuide";
import { useMockScenario } from "@/hooks/useMockScenario";
import { PAGE_SCENARIOS } from "@/mocks/scenarios";
import { mapGuide } from "@/utils/map-guide";

/** The library guide the landing page shows as a real example. */
const SAMPLE_SLUG = "hubspot";

export function LandingPage(): ReactElement {
  useDocumentTitle("OAuth readiness report");
  const { scenario } = useMockScenario(PAGE_SCENARIOS.landing);
  const { data } = useGuide(SAMPLE_SLUG);
  // Loading, not found and failed all leave the sample out: the page reads fine without it.
  const sampleGuide = data ? mapGuide(data) : null;

  return (
    <>
      <Hero
        sampleGuide={sampleGuide}
        isVideoFailed={scenario === "video-error"}
      />
      <VerdictSection guide={sampleGuide} />
      <HowItWorksSection />
      <KindsOfHardSection />
      <EvidenceSection guide={sampleGuide} />
      <ClosingSearchSection />
    </>
  );
}
