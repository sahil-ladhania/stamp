/**
 * File: RunScreen.tsx
 * Purpose: The Live run screen for one scenario: plays the mock events, derives the view, composes the parts.
 *          The page keys it on the scenario, so a new `?state=` starts from a clean slate.
 * Exports: RunScreen
 * Used by: pages/RunPage.tsx
 */
import type { ReactElement } from "react";
import { Container } from "@/components/layout/Container";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useMockPlayback } from "@/hooks/useMockPlayback";
import { getRunSnapshot } from "@/mocks/run-scenarios";
import type { RunScenario } from "@/mocks/scenarios";
import { deriveRunView } from "@/utils/run-view";
import { BudgetStrip } from "./BudgetStrip";
import { getRunCopy } from "./run-copy";
import { RunHeader } from "./RunHeader";
import { StageTimeline } from "./StageTimeline";
import { TracePanel } from "./TracePanel";

export function RunScreen({
  scenario,
}: {
  scenario: RunScenario;
}): ReactElement {
  const snapshot = getRunSnapshot(scenario);
  const { events, elapsedMs } = useMockPlayback(snapshot);
  const view = deriveRunView(events);
  const copy = getRunCopy(view, snapshot.appName, elapsedMs);
  const isRunning = view.outcome.kind === "running";
  useDocumentTitle(copy.heading);

  return (
    <Container className="flex flex-col gap-8 py-12">
      <RunHeader
        copy={copy}
        appName={snapshot.appName}
        currentStageName={view.currentStage?.name ?? null}
        isRunning={isRunning}
      />
      <BudgetStrip
        elapsedMs={elapsedMs}
        pagesRead={view.pagesRead}
        retries={view.retries}
        isRunning={isRunning}
      />
      <div className="grid gap-8 desktop:grid-cols-12 desktop:items-start">
        <StageTimeline stages={view.stages} className="desktop:col-span-4" />
        <TracePanel trace={view.trace} className="desktop:col-span-8" />
      </div>
    </Container>
  );
}
