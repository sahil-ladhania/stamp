/**
 * File: VerdictSection.tsx
 * Purpose: Landing section that shows a real verdict (the sample guide from the API) and the four questions it answers first.
 *          Each question is numbered and links to its row; hovering or focusing a question marks the row. A placeholder holds
 *          the place while the guide loads; without a guide the questions fill the width.
 * Exports: VerdictSection
 * Used by: pages/LandingPage.tsx
 */
import { useState, type ReactElement } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { TextLink } from "@/components/shared/TextLink";
import { Verdict } from "@/components/verdict/Verdict";
import { cn } from "@/lib/utils";
import { sampleGuideOf, type LandingSample } from "@/utils/landing-sample";
import type { VerdictRowId } from "@/utils/verdict";
import { QuestionBody } from "./QuestionBody";
import { VERDICT_QUESTIONS } from "./verdict-questions";

export function VerdictSection({ sample }: { sample: LandingSample }): ReactElement {
  const guide = sampleGuideOf(sample);
  const [highlighted, setHighlighted] = useState<VerdictRowId | null>(null);

  return (
    <section id="sample" aria-labelledby="verdict-heading" className="scroll-mt-4 border-t border-rule py-12">
      <PageContainer className="flex flex-col gap-8">
        <SectionHeading
          id="verdict-heading"
          title="The verdict comes before the steps"
          description="Docs list the clicks and hide the wait. You get the difficulty, the time and the top blocker before a single step."
        />
        <div className="grid gap-8 desktop:grid-cols-12 desktop:items-start">
          {sample.status === "loading" && (
            <div aria-hidden className="h-96 rounded-md border border-rule bg-card desktop:col-span-7" />
          )}
          {guide && (
            <Verdict
              guide={guide}
              highlighted={highlighted}
              detailHref={(row) => `/g/${guide.slug}#${row.section}`}
              className="desktop:col-span-7"
            />
          )}
          <div className={cn("flex flex-col gap-6", sample.status === "missing" ? "desktop:col-span-12" : "desktop:col-span-5")}>
            <ol className="flex flex-col divide-y divide-rule border-y border-rule">
              {VERDICT_QUESTIONS.map((item, index) => (
                <li
                  key={item.question}
                  onMouseEnter={() => setHighlighted(item.row)}
                  onMouseLeave={() => setHighlighted(null)}
                  onFocus={() => setHighlighted(item.row)}
                  onBlur={() => setHighlighted(null)}
                >
                  <QuestionBody index={index + 1} question={item.question} answer={item.answer} to={guide ? `#verdict-${item.row}` : null} />
                </li>
              ))}
            </ol>
            {guide && <TextLink to={`/g/${guide.slug}`}>{`Open the ${guide.appName} guide`}</TextLink>}
          </div>
        </div>
      </PageContainer>
    </section>
  );
}
