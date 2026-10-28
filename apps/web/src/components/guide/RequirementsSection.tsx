/**
 * File: RequirementsSection.tsx
 * Purpose: Guide section 4: what you need before you start, the scopes you request, and the limits that apply. Three stacked
 *          subsections, each item a claim with its label and sources.
 * Exports: RequirementsSection
 * Used by: components/guide/GuideView.tsx
 */
import type { ReactElement, ReactNode } from "react";
import { PageSection } from "@/components/shared/PageSection";
import type { Guide } from "@/types/guide-model";
import { LimitsList } from "./LimitsList";
import { RequirementList } from "./RequirementList";
import { ScopesTable } from "./ScopesTable";

type RequirementsSectionProps = Pick<Guide, "requirements" | "scopes" | "limits">;

function Subsection({ title, children }: { title: string; children: ReactNode }): ReactElement {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <h3 className="text-card-title text-ink">{title}</h3>
      {children}
    </div>
  );
}

export function RequirementsSection({ requirements, scopes, limits }: RequirementsSectionProps): ReactElement {
  return (
    <PageSection
      id="requirements"
      title="Requirements, scopes and limits"
      description="What you need first, what the app asks for, and what caps it."
    >
      <Subsection title="Requirements">
        <RequirementList requirements={requirements} />
      </Subsection>
      <Subsection title="Scopes">
        <ScopesTable scopes={scopes} />
      </Subsection>
      <Subsection title="Limits">
        <LimitsList limits={limits} />
      </Subsection>
    </PageSection>
  );
}
