/**
 * File: DifficultySection.tsx
 * Purpose: How we verify section 4: the fixed difficulty rule, with HubSpot worked through from the mock guide.
 * Exports: DifficultySection
 * Used by: pages/HowWeVerifyPage.tsx
 */
import type { ReactElement } from "react";
import { hubspotGuide } from "@/mocks/guides/hubspot";
import { DifficultyRuleTable } from "./DifficultyRuleTable";
import { ScoreBands } from "./ScoreBands";
import { PageSection } from "@/components/shared/PageSection";

const { appName, difficulty } = hubspotGuide;

// Built from the mock so the sentence cannot disagree with the highlighted cells.
const FACTOR_SUMMARY = difficulty.factors
  .map((factor) => `${factor.name.toLowerCase()} ${factor.points}`)
  .join(", ");

export function DifficultySection(): ReactElement {
  return (
    <PageSection
      id="difficulty"
      title="How difficulty is scored"
      description="The score comes from a fixed rule, not from an AI model. Same inputs, same score."
    >
      <DifficultyRuleTable example={difficulty} exampleName={appName} />
      <div className="flex flex-col gap-3">
        <h3 className="text-card-title text-ink">Worked example: {appName}</h3>
        <p className="max-w-prose text-body text-ink-muted">
          {FACTOR_SUMMARY.charAt(0).toUpperCase() + FACTOR_SUMMARY.slice(1)}.
          That is {difficulty.total} points, so the score is {difficulty.score}{" "}
          of 5. The approval wait is unknown, and an unknown wait counts as 2
          points, so this score is Uncertain.
        </p>
      </div>
      <ScoreBands total={difficulty.total} exampleName={appName} />
    </PageSection>
  );
}
