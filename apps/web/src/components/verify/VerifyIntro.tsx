/**
 * File: VerifyIntro.tsx
 * Purpose: Top of How we verify: the page heading, the contents row, and the four rules Stamp keeps.
 * Exports: VerifyIntro
 * Used by: pages/HowWeVerifyPage.tsx
 */
import type { ReactElement } from "react";
import { Link } from "react-router";
import { Container } from "@/components/layout/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { VERIFY_SECTIONS } from "./verify-sections";

// Reworded for visitors from the project's non-negotiables and docs/design-system.md.
const RULES = [
  "Every claim shows its source, or is labelled Uncertain.",
  "Only code sets labels and difficulty scores. The AI model never does.",
  "Official sources beat third-party guides.",
  "Uncertain is shown plainly, never softened or hidden.",
] as const;

export function VerifyIntro(): ReactElement {
  return (
    <Container className="grid gap-8 py-12 desktop:grid-cols-12 desktop:items-start">
      <div className="flex flex-col gap-6 desktop:col-span-7">
        <SectionHeading
          level={1}
          title="How we verify"
          description="Every fact in a guide is a claim. Each claim carries a label and a source, and code, not an AI model, decides the label."
        />
        <nav
          aria-label="On this page"
          className="flex flex-wrap items-center gap-x-3 gap-y-2"
        >
          <p className="text-small text-ink-muted">On this page:</p>
          <ul className="flex flex-wrap gap-2">
            {VERIFY_SECTIONS.map((section) => (
              <li key={section.id}>
                <Link
                  to={`#${section.id}`}
                  className="inline-block rounded-full border border-rule px-3 py-1 text-small text-ink transition-colors hover:border-ink-muted"
                >
                  {section.navLabel}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <section
        aria-labelledby="rules-heading"
        className="flex flex-col gap-3 rounded-md border border-rule bg-card p-card desktop:col-span-5"
      >
        <h2 id="rules-heading" className="text-card-title text-ink">
          Four rules we keep
        </h2>
        <ul className="flex flex-col divide-y divide-rule border-t border-rule">
          {RULES.map((rule) => (
            <li key={rule} className="py-3 text-body text-ink">
              {rule}
            </li>
          ))}
        </ul>
      </section>
    </Container>
  );
}
