/**
 * File: RequirementsSection.tsx
 * Purpose: Guide section 6: what you need before you start, the scopes you request, and the limits that apply.
 *          Three short groups; each item is a claim with its label and sources.
 * Exports: RequirementsSection
 * Used by: components/guide/GuideView.tsx
 */
import type { ReactElement } from "react";
import { PageSection } from "@/components/shared/PageSection";
import type { Guide } from "@/types/guide-model";
import { ClaimGroup } from "./ClaimGroup";
import { ClaimItem } from "./ClaimItem";
import { ScopeItem } from "./ScopeItem";

type RequirementsSectionProps = Pick<Guide, "requirements" | "scopes" | "limits">;

export function RequirementsSection({
  requirements,
  scopes,
  limits,
}: RequirementsSectionProps): ReactElement {
  return (
    <PageSection
      id="requirements"
      title="Requirements, scopes and limits"
      description="What you need first, what the app asks for, and what caps it."
    >
      <div className="grid gap-8 desktop:grid-cols-3 desktop:items-start">
        <ClaimGroup
          title="Requirements"
          emptyText="Stamp found no requirements in its sources."
          count={requirements.length}
        >
          {requirements.map((claim) => (
            <ClaimItem key={claim.id} claim={claim} />
          ))}
        </ClaimGroup>
        <ClaimGroup
          title="Scopes"
          emptyText="Stamp found no scopes in its sources."
          count={scopes.length}
        >
          {scopes.map((scope) => (
            <ScopeItem key={scope.id} scope={scope} />
          ))}
        </ClaimGroup>
        <ClaimGroup
          title="Limits"
          emptyText="Stamp found no limits in its sources."
          count={limits.length}
        >
          {limits.map((claim) => (
            <ClaimItem key={claim.id} claim={claim} />
          ))}
        </ClaimGroup>
      </div>
    </PageSection>
  );
}
