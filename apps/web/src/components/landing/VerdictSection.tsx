/**
 * File: VerdictSection.tsx
 * Purpose: Landing section that shows a real verdict (the sample guide from the API) and the four questions it answers
 *          first. Without a sample guide the questions fill the width.
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
import type { Guide } from "@/types/guide-model";

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

export function VerdictSection({ guide }: { guide: Guide | null }): ReactElement {
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
          {guide && (
            <div className="desktop:col-span-7">
              <VerdictStamp guide={guide} isTilted />
            </div>
          )}
          <div
            className={cn(
              "flex flex-col gap-6",
              guide ? "desktop:col-span-5" : "desktop:col-span-12",
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
