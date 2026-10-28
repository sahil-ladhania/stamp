/**
 * File: HowItWorksSection.tsx
 * Purpose: Landing section with the three steps from search to a shared guide, and the trust note.
 * Exports: HowItWorksSection
 * Used by: pages/LandingPage.tsx
 */
import type { ReactElement } from "react";
import { Link } from "react-router";
import { Container } from "@/components/layout/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";

// A real sequence, so the steps are numbered. Content from docs/solution.md and docs/flow.md.
const STEPS = [
  {
    title: "Search an app",
    body: "Type a name or a website. A library guide opens straight away.",
  },
  {
    title: "Watch the research",
    body: "Any other app is researched live. You see each search, each page and each claim kept or marked Uncertain.",
  },
  {
    title: "Share the guide",
    body: "Copy a link with the date and every source, and send it to your team.",
  },
] as const;

export function HowItWorksSection(): ReactElement {
  return (
    <section
      aria-labelledby="how-heading"
      className="border-t border-rule py-12"
    >
      <Container size="wide" className="flex flex-col gap-8">
        <SectionHeading id="how-heading" title="How Stamp works" />
        <ol className="grid gap-8 tablet:grid-cols-3">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className="flex flex-col gap-2 border-t-2 border-ink pt-4"
            >
              <span aria-hidden className="text-data text-ink-muted">
                {index + 1}
              </span>
              <h3 className="text-card-title text-ink">{step.title}</h3>
              <p className="text-body text-ink-muted">{step.body}</p>
            </li>
          ))}
        </ol>
        <div className="flex flex-col items-start gap-2">
          <p className="max-w-prose text-body text-ink-muted">
            The model drafts the facts. Code checks every quote and sets the
            score.
          </p>
          <Link
            to="/how-we-verify"
            className="text-body text-sourced underline underline-offset-4"
          >
            Read how we verify
          </Link>
        </div>
      </Container>
    </section>
  );
}
