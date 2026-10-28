/**
 * File: EvidenceSection.tsx
 * Purpose: Landing section that defines Tested, Sourced and Uncertain and, when the sample guide has one, shows
 *          a real labelled claim from it.
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
import { cn } from "@/lib/utils";
import type { Guide } from "@/types/guide-model";
import { pickEvidenceSample } from "@/utils/pick-evidence-sample";

export function EvidenceSection({ guide }: { guide: Guide | null }): ReactElement {
  const sample = guide ? pickEvidenceSample(guide) : null;
  const source = sample?.sources[0];

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
          <EvidenceDefinitionList
            className={cn(sample ? "desktop:col-span-7" : "desktop:col-span-12")}
          />
          {sample && source && (
            <div className="flex flex-col gap-3 rounded-md border border-rule bg-card p-card desktop:col-span-5">
              <p className="text-body text-ink">{sample.text}</p>
              <div className="flex flex-wrap items-center gap-3">
                <EvidenceLabel kind={sample.label} detail={source.title} />
                <SourceLink source={source} />
              </div>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
