/**
 * File: ConflictsSection.tsx
 * Purpose: How we verify section 3: two real source conflicts from the mock guides and how Stamp settles them.
 * Exports: ConflictsSection
 * Used by: pages/HowWeVerifyPage.tsx
 */
import type { ReactElement } from "react";
import { ConflictCard } from "@/components/guide/ConflictCard";
import { hubspotGuide } from "@/mocks/guides/hubspot";
import { salesforceGuide } from "@/mocks/guides/salesforce";
import { PageSection } from "@/components/shared/PageSection";

export function ConflictsSection(): ReactElement {
  return (
    <PageSection
      id="conflicts"
      title="When sources disagree"
      description="Stamp keeps both claims, prefers the official source, then the newer one, and says why."
    >
      <div className="grid gap-4 desktop:grid-cols-2">
        <ConflictCard
          appName="Salesforce"
          conflict={salesforceGuide.conflicts[0]}
        />
        <ConflictCard appName="HubSpot" conflict={hubspotGuide.conflicts[0]} />
      </div>
    </PageSection>
  );
}
