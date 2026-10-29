/**
 * File: GuideSkeleton.tsx
 * Purpose: The guide page while the guide loads: a static skeleton of the header and the verdict. No pulse, so there is no motion to switch off.
 * Exports: GuideSkeleton
 * Used by: pages/GuidePage.tsx
 */
import type { ReactElement } from "react";
import { PageContainer } from "@/components/layout/PageContainer";

export function GuideSkeleton(): ReactElement {
  return (
    <div aria-busy="true">
      <PageContainer className="flex flex-col gap-8 py-12">
        <p role="status" className="text-small text-ink-muted">
          Loading the guide
        </p>
        <div aria-hidden className="flex flex-col gap-3">
          <span className="h-8 w-48 rounded-sm bg-rule" />
          <span className="h-4 w-2/3 rounded-sm bg-rule" />
          <span className="h-4 w-1/2 rounded-sm bg-rule" />
        </div>
        <div
          aria-hidden
          className="h-48 rounded-md border border-rule bg-card"
        />
      </PageContainer>
    </div>
  );
}
