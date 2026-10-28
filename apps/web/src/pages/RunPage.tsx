/**
 * File: RunPage.tsx
 * Purpose: Live run route `/run/:id`. Reads the `?state=` scenario and renders the run screen for it.
 *          The id is ignored in the mock phase: every run replays the same HubSpot events.
 * Exports: RunPage
 * Used by: router.tsx
 */
import type { ReactElement } from "react";
import { RunScreen } from "@/components/run/RunScreen";
import { useMockScenario } from "@/hooks/useMockScenario";
import { PAGE_SCENARIOS } from "@/mocks/scenarios";

export function RunPage(): ReactElement {
  const { scenario } = useMockScenario(PAGE_SCENARIOS.run);

  return <RunScreen key={scenario} scenario={scenario} />;
}
