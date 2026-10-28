/**
 * File: RunActions.tsx
 * Purpose: The next actions on the Live run page. A link opens a page; a button starts the run again or reconnects.
 * Exports: RunActions
 * Used by: components/run/RunScreen.tsx
 */
import type { ReactElement } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import type { RunAction } from "./run-copy";

type RunActionsProps = {
  actions: readonly RunAction[];
  /** A new run is starting, so its button is disabled. */
  isPending: boolean;
  onNewRun: () => void;
  onReconnect: () => void;
};

export function RunActions({
  actions,
  isPending,
  onNewRun,
  onReconnect,
}: RunActionsProps): ReactElement | null {
  if (actions.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {actions.map((action) =>
        action.kind === "link" ? (
          <Link
            key={action.label}
            to={action.to}
            className={buttonVariants({ variant: action.variant, size: "lg" })}
          >
            {action.label}
          </Link>
        ) : (
          <Button
            key={action.label}
            variant={action.variant}
            size="lg"
            disabled={isPending}
            onClick={action.kind === "new-run" ? onNewRun : onReconnect}
          >
            {action.label}
          </Button>
        ),
      )}
    </div>
  );
}
