/**
 * File: guide-scenarios.ts
 * Purpose: Turns a library guide into its partial version for `?state=partial`: a run that timed out keeps what it
 *          found and marks the rest Uncertain (docs/solution.md section 8).
 * Exports: GUIDE_SECTION, applyGuideScenario
 * Used by: pages/GuidePage.tsx, components/guide/GuideView.tsx
 */
import type { GuideScenario } from "./scenarios";
import type { Guide } from "./types";

/** The names a partial guide lists in `uncertainSections`. */
export const GUIDE_SECTION = {
  steps: "Steps",
  blockers: "Blockers",
  conflicts: "Source conflicts",
} as const;

const PARTIAL_SECTIONS = [
  GUIDE_SECTION.steps,
  GUIDE_SECTION.blockers,
  GUIDE_SECTION.conflicts,
];

/** Only `partial` changes the guide. The not-OAuth and no-docs states do not use a guide at all. */
export function applyGuideScenario(
  guide: Guide,
  scenario: GuideScenario,
): Guide {
  if (scenario !== "partial") return guide;
  return {
    ...guide,
    status: "partial",
    steps: [],
    blockers: [],
    conflicts: [],
    uncertainSections: PARTIAL_SECTIONS,
  };
}
