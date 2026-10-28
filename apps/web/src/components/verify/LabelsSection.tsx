/**
 * File: LabelsSection.tsx
 * Purpose: How we verify section 1: what Tested, Sourced and Uncertain mean, and how a claim gets one.
 * Exports: LabelsSection
 * Used by: pages/HowWeVerifyPage.tsx
 */
import type { ReactElement } from "react";
import { EvidenceDefinitionList } from "@/components/shared/EvidenceDefinitionList";
import { DecisionPath } from "./DecisionPath";
import { PageSection } from "@/components/shared/PageSection";

export function LabelsSection(): ReactElement {
  return (
    <PageSection
      id="labels"
      title="Three labels, one decision path"
      description="Uncertain is not a failure. It is the honest answer when we cannot confirm a claim."
    >
      <EvidenceDefinitionList />
      <DecisionPath />
    </PageSection>
  );
}
