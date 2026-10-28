/**
 * File: CannotVerifySection.tsx
 * Purpose: How we verify section 6: the honest limits of what Stamp can prove, in an amber panel.
 * Exports: CannotVerifySection
 * Used by: pages/HowWeVerifyPage.tsx
 */
import type { ReactElement } from "react";
import { PageSection } from "@/components/shared/PageSection";

// Each limit comes from docs/solution.md section 9, docs/features.md (S1) or docs/product.md.
const LIMITS = [
  {
    limit: "Sourced means the page says it, not that the page is right.",
    detail:
      "The quote check proves the words are on the page. A provider page can be wrong or out of date.",
  },
  {
    limit: "Approval waits are not tested.",
    detail:
      "No real provider review was submitted, so waits are sourced, not tested. We also do not yet know how close our predicted waits are to reality.",
  },
  {
    limit: "Tested covers only what was run.",
    detail:
      "A probe calls a provider's authorize URL with a dummy client ID and records the response. It does not prove the whole setup works.",
  },
  {
    limit: "Private and partner-only docs stay Uncertain.",
    detail: "Live guides depend on public docs.",
  },
  {
    limit: "Coverage is small.",
    detail:
      "The library has five apps. Any other app is researched live, from public pages.",
  },
  {
    limit: "Guides age.",
    detail:
      "Every guide shows an as-of date. Stamp does not yet re-check a saved guide on its own, so check the date before you rely on it.",
  },
] as const;

/** Amber is the Uncertain colour, so the limits read as what is not confirmed. */
export function CannotVerifySection(): ReactElement {
  return (
    <PageSection
      id="cannot-verify"
      title="What Stamp cannot verify"
      description="A label is only as strong as what stands behind it. These are the limits."
    >
      <ul className="flex flex-col divide-y divide-uncertain/30 rounded-md border border-uncertain bg-uncertain-bg px-4 tablet:px-6">
        {LIMITS.map((item) => (
          <li key={item.limit} className="flex flex-col gap-1 py-4">
            <p className="text-card-title text-ink">{item.limit}</p>
            <p className="text-body text-ink-muted">{item.detail}</p>
          </li>
        ))}
      </ul>
    </PageSection>
  );
}
