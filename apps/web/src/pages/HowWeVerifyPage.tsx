/**
 * File: HowWeVerifyPage.tsx
 * Purpose: How we verify route `/how-we-verify`. Composes the intro and the six sections; holds no logic of its own.
 * Exports: HowWeVerifyPage
 * Used by: router.tsx
 */
import type { ReactElement } from "react";
import { CannotVerifySection } from "@/components/verify/CannotVerifySection";
import { ConflictsSection } from "@/components/verify/ConflictsSection";
import { DifficultySection } from "@/components/verify/DifficultySection";
import { LabelsSection } from "@/components/verify/LabelsSection";
import { LimitsSection } from "@/components/verify/LimitsSection";
import { QuoteCheckSection } from "@/components/verify/QuoteCheckSection";
import { VerifyClosing } from "@/components/verify/VerifyClosing";
import { VerifyIntro } from "@/components/verify/VerifyIntro";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export function HowWeVerifyPage(): ReactElement {
  useDocumentTitle("How we verify");

  return (
    <>
      <VerifyIntro />
      <LabelsSection />
      <QuoteCheckSection />
      <ConflictsSection />
      <DifficultySection />
      <LimitsSection />
      <CannotVerifySection />
      <VerifyClosing />
    </>
  );
}
