/**
 * File: LandingPage.tsx
 * Purpose: Landing route `/`. Composes the hero and the five sections; holds no logic of its own.
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
import { useMockScenario } from "@/hooks/useMockScenario";
import { PAGE_SCENARIOS } from "@/mocks/scenarios";

export function LandingPage(): ReactElement {
  useDocumentTitle("");
  const { scenario } = useMockScenario(PAGE_SCENARIOS.landing);

  return (
    <>
      <Hero isVideoFailed={scenario === "video-error"} />
      <VerdictSection />
      <HowItWorksSection />
      <KindsOfHardSection />
      <EvidenceSection />
      <ClosingSearchSection />
    </>
  );
}
