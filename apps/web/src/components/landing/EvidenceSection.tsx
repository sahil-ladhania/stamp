/**
 * File: EvidenceSection.tsx
 * Purpose: Landing section that defines Tested, Sourced and Uncertain and shows one real labelled claim.
 * Exports: EvidenceSection
 * Used by: pages/LandingPage.tsx
 */
import type { ReactElement } from "react";
import { Link } from "react-router";
import { Container } from "@/components/layout/Container";
import { EvidenceDefinitionList } from "@/components/shared/EvidenceDefinitionList";
import { EvidenceLabel } from "@/components/shared/EvidenceLabel";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { SourceLink } from "@/components/shared/SourceLink";
import { hubspotGuide } from "@/mocks/guides/hubspot";

// The 25 install cap: a Sourced claim in the HubSpot mock.
const SAMPLE_CLAIM = hubspotGuide.milestones[1].claims[0];
const SAMPLE_SOURCE = SAMPLE_CLAIM.sources[0];

export function EvidenceSection(): ReactElement {
  return (
    <section
      aria-labelledby="evidence-heading"
      className="border-t border-rule py-12"
    >
      <Container size="wide" className="flex flex-col gap-8">
        <SectionHeading
          id="evidence-heading"
          title="Every claim has a label"
          description="Stamp tells you how it knows each fact. Uncertain is shown plainly."
          aside={
            <Link
              to="/how-we-verify"
              className="text-body text-sourced underline underline-offset-4"
            >
              Read how we verify
            </Link>
          }
        />
        <div className="grid gap-8 desktop:grid-cols-12 desktop:items-start">
          <EvidenceDefinitionList className="desktop:col-span-7" />
          <div className="flex flex-col gap-3 rounded-md border border-rule bg-card p-card desktop:col-span-5">
            <p className="text-body text-ink">{SAMPLE_CLAIM.text}</p>
            <div className="flex flex-wrap items-center gap-3">
              <EvidenceLabel
                kind={SAMPLE_CLAIM.label}
                detail={SAMPLE_SOURCE.title}
              />
              <SourceLink source={SAMPLE_SOURCE} />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
