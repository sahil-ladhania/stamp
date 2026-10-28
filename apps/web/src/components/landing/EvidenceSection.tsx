/**
 * File: EvidenceSection.tsx
 * Purpose: Landing section that defines Tested, Sourced and Uncertain and, when the sample guide has one, shows
 *          a real labelled claim from it.
 * Exports: EvidenceSection
 * Used by: pages/LandingPage.tsx
 */
import type { ReactElement } from "react";
import { Link } from "react-router";
import { PageContainer } from "@/components/layout/PageContainer";
import { EvidenceDefinitionList } from "@/components/shared/EvidenceDefinitionList";
import { EvidenceLabel } from "@/components/shared/EvidenceLabel";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { SourceLink } from "@/components/shared/SourceLink";
import { cn } from "@/lib/utils";
import { sampleGuideOf, type LandingSample } from "@/utils/landing-sample";
import { pickEvidenceSample } from "@/utils/pick-evidence-sample";

export function EvidenceSection({ sample }: { sample: LandingSample }): ReactElement {
  const guide = sampleGuideOf(sample);
  const claim = guide ? pickEvidenceSample(guide) : null;
  const source = claim?.sources[0];
  const isLoading = sample.status === "loading";

  return (
    <section
      aria-labelledby="evidence-heading"
      className="border-t border-rule py-12"
    >
      <PageContainer className="flex flex-col gap-8">
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
          <EvidenceDefinitionList
            className={cn(
              claim || isLoading ? "desktop:col-span-7" : "desktop:col-span-12",
            )}
          />
          {isLoading && (
            <div
              aria-hidden
              className="h-28 rounded-md border border-rule bg-card desktop:col-span-5"
            />
          )}
          {claim && source && (
            <div className="flex flex-col gap-3 rounded-md border border-rule bg-card p-card desktop:col-span-5">
              <p className="text-body text-ink">{claim.text}</p>
              <div className="flex flex-wrap items-center gap-3">
                <EvidenceLabel kind={claim.label} detail={source.title} />
                <SourceLink source={source} />
              </div>
            </div>
          )}
        </div>
      </PageContainer>
    </section>
  );
}
