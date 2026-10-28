/**
 * File: ConflictsSection.tsx
 * Purpose: How we verify section 3: two worked source conflicts (editorial examples) and how Stamp settles them.
 * Exports: ConflictsSection
 * Used by: pages/HowWeVerifyPage.tsx
 */
import type { ReactElement } from "react";
import { ConflictCard } from "@/components/guide/ConflictCard";
import { PageSection } from "@/components/shared/PageSection";
import {
  HUBSPOT_CONFLICT,
  SALESFORCE_CONFLICT,
} from "@/content/verify-examples";

export function ConflictsSection(): ReactElement {
  return (
    <PageSection
      id="conflicts"
      title="When sources disagree"
      description="Stamp keeps both sources, prefers the official one, then the newer one, and says why."
    >
      <div className="grid gap-4 desktop:grid-cols-2">
        <ConflictCard
          appName="Salesforce"
          conflict={SALESFORCE_CONFLICT}
          hasReasonEvidence={false}
        />
        <ConflictCard
          appName="HubSpot"
          conflict={HUBSPOT_CONFLICT}
          hasReasonEvidence={false}
        />
      </div>
    </PageSection>
  );
}
