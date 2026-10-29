/**
 * File: RunScreen.tsx
 * Purpose: The Live run screen for one run: follows the stream, derives the view, and composes the header, the
 *          "Did you mean" panel, the budget strip, the stage list and the trace. The page keys it on the run id.
 * Exports: RunScreen
 * Used by: pages/RunPage.tsx
 */
import type { ReactElement } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useRunClock } from "@/hooks/useRunClock";
import { useRunStream } from "@/hooks/useRunStream";
import { useStartRun } from "@/hooks/useStartRun";
import { resolveAppName } from "@/utils/app-name";
import { getApiErrorMessage } from "@/utils/error-messages";
import { AmbiguousOptions } from "./AmbiguousOptions";
import { BudgetStrip } from "./BudgetStrip";
import {
  getRunCopy,
  getRunStatusLine,
  getStreamFailureCopy,
} from "./run-copy";
import { RunActions } from "./RunActions";
import { RunHeader } from "./RunHeader";
import { StageTimeline } from "./StageTimeline";
import { TracePanel } from "./TracePanel";

type RunScreenProps = {
  runId: string;
  /** What the visitor typed (`?app=`). The slug is the fallback. */
  appParam: string | null;
  /** Follows the run again, for a stream that failed. */
  onReconnect: () => void;
};

export function RunScreen({
  runId,
  appParam,
  onReconnect,
}: RunScreenProps): ReactElement {
  const { snapshot, view, connection, error } = useRunStream(runId);
  const { start, isPending, error: startError } = useStartRun();
  const { outcome } = view;

  const isRunning = outcome.kind === "running" && error === null;
  const isSummaryOnly =
    error !== null || (outcome.kind !== "running" && view.trace.length === 0);
  const appName = resolveAppName(appParam, snapshot?.slug ?? null);
  const elapsedMs = useRunClock(snapshot, isRunning);
  const copy = error
    ? getStreamFailureCopy(error)
    : getRunCopy(view, { appName, elapsedMs, isSummaryOnly });
  const statusLine = getRunStatusLine({
    isRunning,
    isConnecting: connection === "connecting",
    currentStageName: view.currentStage?.name ?? null,
    heading: copy.heading,
  });
  useDocumentTitle(copy.heading);

  // The slug is what the API normalises, so it is the safest name to research again.
  const retryApp = appParam?.trim() || snapshot?.slug || null;
  function startNewRun(): void {
    if (retryApp) void start(retryApp, { force: true });
  }

  return (
    <PageContainer className="flex flex-col gap-8 py-12">
      <RunHeader
        copy={copy}
        appSlug={snapshot?.slug ?? null}
        statusLine={statusLine}
        isRunning={isRunning}
        actions={
          <RunActions
            actions={copy.actions}
            isPending={isPending}
            onNewRun={startNewRun}
            onReconnect={onReconnect}
          />
        }
      />
      {outcome.kind === "error" && outcome.code === "AMBIGUOUS_APP" && (
        <AmbiguousOptions
          options={outcome.options}
          isPending={isPending}
          onChoose={(domain) => void start(domain)}
        />
      )}
      {startError && (
        <p role="alert" className="text-small text-ink">
          {getApiErrorMessage(startError)}
        </p>
      )}
      {connection === "reconnecting" && (
        <p role="status" className="text-small text-ink-muted">
          Connection lost. Reconnecting.
        </p>
      )}
      {!isSummaryOnly && (
        <>
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
        </>
      )}
    </PageContainer>
  );
}
