/**
 * File: RunPage.tsx
 * Purpose: Live run route `/run/:id`. Reads the run id and the typed app name, and keys the screen so a new run
 *          or a reconnect starts from a clean slate.
 * Exports: RunPage
 * Used by: router.tsx
 */
import { useState, type ReactElement } from "react";
import { useParams, useSearchParams } from "react-router";
import { RunScreen } from "@/components/run/RunScreen";

export function RunPage(): ReactElement {
  const { id = "" } = useParams();
  const [searchParams] = useSearchParams();
  const [attempt, setAttempt] = useState(0);

  return (
    <RunScreen
      key={`${id}:${attempt}`}
      runId={id}
      appParam={searchParams.get("app")}
      onReconnect={() => setAttempt((count) => count + 1)}
    />
  );
}
