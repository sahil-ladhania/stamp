/**
 * File: QuoteCheckSection.tsx
 * Purpose: How we verify section 2: why code, not the AI model, checks every quote, and who does what.
 * Exports: QuoteCheckSection
 * Used by: pages/HowWeVerifyPage.tsx
 */
import type { ReactElement } from "react";
import { StageList } from "./StageList";
import { PageSection } from "@/components/shared/PageSection";

const REASONS = [
  "A model checking another model can agree with a mistake. Code checking a quote cannot.",
  "Text in a page is treated as data, never as instructions.",
] as const;

export function QuoteCheckSection(): ReactElement {
  return (
    <PageSection
      id="quote-check"
      title="Code checks every quote"
      description="The AI model reads pages and drafts claims. It never decides what is true. For each draft claim, our code checks that the quote appears in the page we fetched. A miss becomes Uncertain."
    >
      <ul className="flex flex-col gap-4">
        {REASONS.map((reason) => (
          <li
            key={reason}
            className="max-w-prose border-l-2 border-ink pl-4 text-body text-ink"
          >
            {reason}
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-4">
        <h3 className="text-card-title text-ink">
          Nine fixed stages, two use an AI model
        </h3>
        <StageList />
        <p className="max-w-prose text-small text-ink-muted">
          Only two of the nine stages call an AI model: planning searches and
          extracting facts. Code resolves the app, verifies quotes, scores and
          saves.
        </p>
      </div>
    </PageSection>
  );
}
