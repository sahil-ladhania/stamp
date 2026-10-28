/**
 * File: VerdictSection.tsx
 * Purpose: Landing section that shows a real verdict (the sample guide from the API) and the four questions it answers
 *          first. A placeholder holds the place while the guide loads; without one the questions fill the width.
 * Exports: VerdictSection
 * Used by: pages/LandingPage.tsx
 */
import type { ReactElement } from "react";
import { Link } from "react-router";
import { VerdictStamp } from "@/components/guide/VerdictStamp";
import { Container } from "@/components/layout/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { sampleGuideOf, type LandingSample } from "@/utils/landing-sample";

// From docs/solution.md section 2.
const QUESTIONS = [
  {
    question: "How hard is it?",
    answer: "A difficulty score from 1 to 5, with the reason behind it.",
  },
  {
    question: "How long will it take?",
    answer: "Two milestones: the first test connection and production.",
  },
  {
    question: "What could block me?",
    answer: "Blocker cards with the symptom, cause, fix and who to contact.",
  },
  {
    question: "What can an agent do for me?",
    answer: "Every step is marked agent, human or agent-assist.",
  },
] as const;

export function VerdictSection({ sample }: { sample: LandingSample }): ReactElement {
  const guide = sampleGuideOf(sample);
  return (
    <section
      aria-labelledby="verdict-heading"
      className="border-t border-rule py-12"
    >
      <Container size="wide" className="flex flex-col gap-8">
        <SectionHeading
          id="verdict-heading"
          title="The verdict comes before the steps"
          description="Docs list the clicks and hide the wait. You get the difficulty, the time and the top blocker before a single step."
        />
        <div className="grid gap-8 desktop:grid-cols-12 desktop:items-start">
          {sample.status === "loading" && (
            <div
              aria-hidden
              className="h-72 rounded-md border border-rule bg-card desktop:col-span-7"
            />
          )}
          {guide && (
            <div className="desktop:col-span-7">
              <VerdictStamp guide={guide} isTilted />
            </div>
          )}
          <div
            className={cn(
              "flex flex-col gap-6",
              sample.status === "missing"
                ? "desktop:col-span-12"
                : "desktop:col-span-5",
            )}
          >
            <dl className="flex flex-col divide-y divide-rule border-y border-rule">
              {QUESTIONS.map((item) => (
                <div key={item.question} className="flex flex-col gap-1 py-4">
                  <dt className="text-card-title text-ink">{item.question}</dt>
                  <dd className="text-body text-ink-muted">{item.answer}</dd>
                </div>
              ))}
            </dl>
            {guide && (
              <Link
                to={`/g/${guide.slug}`}
                className={buttonVariants({
                  variant: "secondary",
                  className: "self-start",
                })}
              >
                {`Open the ${guide.appName} guide`}
              </Link>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
