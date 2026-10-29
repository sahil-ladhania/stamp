/**
 * File: RunNotice.tsx
 * Purpose: A run that did not finish, as a callout: what happened and what to do next. Any children (the "did you mean" options) sit
 *          inside it. The trace so far stays visible under it, collapsed.
 * Exports: RunNotice
 * Used by: components/run/RunScreen.tsx
 */
import type { ReactElement, ReactNode } from "react";
import { Callout } from "@/components/shared/Callout";
import { RunActions } from "./RunActions";
import type { RunNoticeCopy } from "./run-error-copy";

type RunNoticeProps = {
  notice: RunNoticeCopy;
  isPending: boolean;
  onNewRun: () => void;
  onReconnect: () => void;
  children?: ReactNode;
};

export function RunNotice({ notice, isPending, onNewRun, onReconnect, children }: RunNoticeProps): ReactElement {
  return (
    <Callout
      variant="warning"
      role="alert"
      title={notice.title}
      actions={
        notice.actions.length > 0 ? (
          <RunActions actions={notice.actions} isPending={isPending} onNewRun={onNewRun} onReconnect={onReconnect} />
        ) : undefined
      }
    >
      <div className="flex flex-col gap-4">
        <p className="max-w-prose text-ink-muted">{notice.lead}</p>
        {children}
      </div>
    </Callout>
  );
}
