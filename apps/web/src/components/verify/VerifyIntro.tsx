/**
 * File: VerifyIntro.tsx
 * Purpose: Top of How we verify: the page heading and the four rules Stamp keeps. The page's section navigation sits beside it.
 * Exports: VerifyIntro
 * Used by: pages/HowWeVerifyPage.tsx
 */
import type { ReactElement } from "react";
import { SectionHeading } from "@/components/shared/SectionHeading";

// Reworded for visitors from the project's non-negotiables and docs/design-system.md.
const RULES = [
  "Every claim shows its source, or is labelled Uncertain.",
  "Only code sets labels and difficulty scores. The AI model never does.",
  "Official sources beat third-party guides.",
  "Uncertain is shown plainly, never softened or hidden.",
] as const;

export function VerifyIntro(): ReactElement {
  return (
    <div className="flex flex-col gap-8 py-10">
      <SectionHeading
        level={1}
        title="How we verify"
        description="Every fact in a guide is a claim. Each claim carries a label and a source, and code, not an AI model, decides the label."
      />
      <section aria-labelledby="rules-heading" className="flex flex-col gap-3 rounded-md border border-rule bg-card p-card">
        <h2 id="rules-heading" className="text-card-title text-ink">
          Four rules we keep
        </h2>
        <ul className="grid gap-x-8 divide-y divide-rule border-t border-rule tablet:grid-cols-2 tablet:divide-y-0">
          {RULES.map((rule) => (
            <li key={rule} className="py-3 text-body text-ink">
              {rule}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
