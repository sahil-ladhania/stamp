/**
 * File: EvidenceSection.tsx
 * Purpose: Landing section that defines Tested, Sourced and Uncertain and, when the sample guide has one, shows a real labelled claim
 *          with its evidence open: the sources, the quote and when it was read. It ends with the one link to how Stamp verifies.
 * Exports: EvidenceSection
 * Used by: pages/LandingPage.tsx
 */
import type { ReactElement } from "react";
import { EvidencePanel } from "@/components/evidence/EvidencePanel";
import { PageContainer } from "@/components/layout/PageContainer";
import { EvidenceDefinitionList } from "@/components/shared/EvidenceDefinitionList";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { TextLink } from "@/components/shared/TextLink";
import { cn } from "@/lib/utils";
import { sampleGuideOf, type LandingSample } from "@/utils/landing-sample";
import { pickEvidenceSample } from "@/utils/pick-evidence-sample";

export function EvidenceSection({ sample }: { sample: LandingSample }): ReactElement {
  const guide = sampleGuideOf(sample);
  const claim = guide ? pickEvidenceSample(guide) : null;
  const isLoading = sample.status === "loading";

  return (
    <section aria-labelledby="evidence-heading" className="border-t border-rule py-12">
      <PageContainer className="flex flex-col gap-8">
        <SectionHeading
          id="evidence-heading"
          title="Every claim has a label"
          description="Stamp tells you how it knows each fact. Uncertain is shown plainly."
        />
        <div className="grid gap-8 desktop:grid-cols-12 desktop:items-start">
          <EvidenceDefinitionList className={cn(claim || isLoading ? "desktop:col-span-7" : "desktop:col-span-12")} />
          {isLoading && <div aria-hidden className="h-56 rounded-md border border-rule bg-card desktop:col-span-5" />}
          {guide && claim && (
            <figure className="m-0 flex flex-col gap-2 desktop:col-span-5">
              <div className="rounded-md border border-ink bg-card p-4">
                <EvidencePanel claim={claim} />
              </div>
              <figcaption className="text-small text-ink-muted">
                {`A claim from the ${guide.appName} guide. Every claim opens like this.`}
              </figcaption>
            </figure>
          )}
        </div>
        <TextLink to="/how-we-verify">Read how we verify</TextLink>
      </PageContainer>
    </section>
  );
}
