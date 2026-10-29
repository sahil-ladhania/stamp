/**
 * File: HowWeVerifyPage.tsx
 * Purpose: How we verify route `/how-we-verify`. Composes the intro and the six sections beside the section navigation; holds no
 *          logic of its own.
 * Exports: HowWeVerifyPage
 * Used by: router.tsx
 */
import type { ReactElement } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionNav } from "@/components/nav/SectionNav";
import { CannotVerifySection } from "@/components/verify/CannotVerifySection";
import { ConflictsSection } from "@/components/verify/ConflictsSection";
import { DifficultySection } from "@/components/verify/DifficultySection";
import { LabelsSection } from "@/components/verify/LabelsSection";
import { LimitsSection } from "@/components/verify/LimitsSection";
import { QuoteCheckSection } from "@/components/verify/QuoteCheckSection";
import { VerifyClosing } from "@/components/verify/VerifyClosing";
import { VerifyIntro } from "@/components/verify/VerifyIntro";
import { VERIFY_NAV_ITEMS } from "@/components/verify/verify-sections";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export function HowWeVerifyPage(): ReactElement {
  useDocumentTitle("How we verify");

  return (
    <>
      <PageContainer className="grid gap-x-12 desktop:grid-cols-[13rem_minmax(0,1fr)]">
        <SectionNav items={VERIFY_NAV_ITEMS} />
        <div className="flex min-w-0 flex-col desktop:col-start-2 desktop:row-start-1">
          <VerifyIntro />
          <LabelsSection />
          <QuoteCheckSection />
          <ConflictsSection />
          <DifficultySection />
          <LimitsSection />
          <CannotVerifySection />
        </div>
      </PageContainer>
      <VerifyClosing />
    </>
  );
}
