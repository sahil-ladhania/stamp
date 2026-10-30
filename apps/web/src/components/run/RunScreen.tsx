/**
 * File: RunScreen.tsx
 * Purpose: The Live run screen for one run: follows the stream, works out the phase, and composes the sticky header, the notice for a run
 *          that did not finish, the result card, and the merged timeline. The page keys it on the run id.
 * Exports: RunScreen
 * Used by: pages/RunPage.tsx
 */
import type { ReactElement } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useFollowScroll } from "@/hooks/useFollowScroll";
import { useRunResult } from "@/hooks/useRunResult";
import { useRunStream } from "@/hooks/useRunStream";
import { useStartRun } from "@/hooks/useStartRun";
import type { ApiError } from "@/lib/api-error";
import { resolveRunAppName } from "@/utils/app-name";
import { getApiErrorMessage } from "@/utils/error-messages";
import { getRunPhase } from "@/utils/run-phase";
import { buildStageGroups } from "@/utils/run-groups";
import type { RunOutcome } from "@/utils/run-view";
import { researchedAs } from "@/utils/researched-as";
import { AmbiguousOptions } from "./AmbiguousOptions";
import { JumpToLatest } from "./JumpToLatest";
import { RunHeader } from "./RunHeader";
import { RunMeters } from "./RunMeters";
import { RunNotice } from "./RunNotice";
import { RunResultCard } from "./RunResultCard";
import { getRunTitle, getStageLine } from "./run-copy";
import { getErrorNotice, getStreamFailureNotice, type RunNoticeCopy } from "./run-error-copy";
import { TraceTimeline } from "./TraceTimeline";

type RunScreenProps = {
  runId: string;
  /** What the visitor typed (`?app=`). */
  appParam: string | null;
  /** Follows the run again, for a stream that failed. */
  onReconnect: () => void;
};

/** A run error, or a stream that failed before any terminal event. A finished run has neither. */
function getNotice(outcome: RunOutcome, error: ApiError | null): RunNoticeCopy | null {
  if (outcome.kind === "error") return getErrorNotice(outcome.code, outcome.stage, outcome.options.length > 0);
  if (outcome.kind === "running" && error) return getStreamFailureNotice(error);
  return null;
}

export function RunScreen({ runId, appParam, onReconnect }: RunScreenProps): ReactElement {
  const { snapshot, view, events, connection, error } = useRunStream(runId);
  const { start, isPending, error: startError } = useStartRun();
  const { outcome } = view;

  const phase = getRunPhase({ outcome, error, connection, hasEvents: events.length > 0 });
  const isRunning = phase === "connecting" || phase === "running";
  const hasTrace = events.length > 0;
  const savedSlug = outcome.kind === "done" ? outcome.slug : null;
  const { guide, isLoading: isGuideLoading } = useRunResult(savedSlug);
  const appName = resolveRunAppName({ guideName: guide?.appName ?? null, typed: appParam, slug: snapshot?.slug ?? null });
  const notice = getNotice(outcome, error);
  const groups = buildStageGroups(view.stages, events);
  const { endRef, hasUnseen, jumpToLatest } = useFollowScroll(isRunning, events.length);

  const stage = view.currentStage?.stage ?? (outcome.kind === "error" ? outcome.stage : null);
  useDocumentTitle(getRunTitle(phase, appName, notice?.title ?? null));

  // The slug is what the API normalises, so it is the safest name to research again.
  const retryApp = appParam?.trim() || snapshot?.slug || null;
  function startNewRun(): void {
    if (retryApp) void start(retryApp, { force: true });
  }

  return (
    <>
      <RunHeader
        appName={appName}
        slug={snapshot?.slug ?? null}
        phase={phase}
        stageLine={getStageLine({ phase, stage })}
        researchedAs={view.researched ? researchedAs(view.researched) : null}
        meters={
          phase === "not-found" ? null : (
            <RunMeters snapshot={snapshot} isRunning={isRunning} pagesRead={view.pagesRead} retries={view.retries} />
          )
        }
      />
      <PageContainer className="flex flex-col gap-8 py-8">
        {notice && (
          <RunNotice notice={notice} isPending={isPending} onNewRun={startNewRun} onReconnect={onReconnect}>
            {outcome.kind === "error" && outcome.options.length > 0 && (
              <AmbiguousOptions options={outcome.options} isPending={isPending} onChoose={(domain) => void start(domain)} />
            )}
          </RunNotice>
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
        {savedSlug && (
          <RunResultCard
            slug={savedSlug}
            isPartial={phase === "partial"}
            guide={guide}
            isGuideLoading={isGuideLoading}
            snapshot={snapshot}
            downgradedIds={events.flatMap((event) => (event.type === "claim.downgraded" ? [event.claimId] : []))}
            hasTrace={hasTrace}
            isPending={isPending}
            onNewRun={startNewRun}
          />
        )}
        {phase !== "not-found" && (hasTrace || isRunning) && (
          <TraceTimeline groups={groups} isLive={isRunning} hasEvents={hasTrace} />
        )}
        <div ref={endRef} aria-hidden />
      </PageContainer>
      {isRunning && hasUnseen && <JumpToLatest onClick={jumpToLatest} />}
    </>
  );
}
