/**
 * File: ClosingBanner.tsx
 * Purpose: Landing closing banner: a second search entry point after the visitor has read the page, on a card with a quiet pattern.
 * Exports: ClosingBanner
 * Used by: pages/LandingPage.tsx
 */
import type { ReactElement } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { StartRunSearch } from "@/components/shared/StartRunSearch";
import { BannerPattern } from "./BannerPattern";

export function ClosingBanner(): ReactElement {
  return (
    <section aria-labelledby="closing-heading" className="border-t border-rule py-12">
      <PageContainer>
        <div className="relative isolate overflow-hidden rounded-md border border-rule bg-card px-4 py-16 tablet:px-6 tablet:py-20">
          <BannerPattern />
          <div className="mx-auto flex max-w-xl flex-col items-center gap-6 text-center">
            <div className="flex flex-col gap-2">
              <h2 id="closing-heading" className="text-section text-balance text-ink">
                Get a guide for any app
              </h2>
              <p className="text-body text-ink-muted">Search any app. If it has no guide yet, the agent researches it live.</p>
            </div>
            <StartRunSearch size="lg" className="w-full text-left" />
          </div>
        </div>
      </PageContainer>
    </section>
  );
}
