/**
 * File: RunHeader.tsx
 * Purpose: The sticky bar of the Live run page: the app, the status pill, the current stage in plain words, and the meters. It stays
 *          in view while the trace scrolls. Only the stage line is a polite live region, so a screen reader hears stage changes and not
 *          every event.
 * Exports: RunHeader
 * Used by: components/run/RunScreen.tsx
 */
import type { ReactElement, ReactNode } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { AppIdentity } from "@/components/shared/AppIdentity";
import type { RunPhase } from "@/utils/run-phase";
import { RunStatusPill } from "./RunStatusPill";

type RunHeaderProps = {
  /** The resolved display name. Null before any source has it. */
  appName: string | null;
  slug: string | null;
  phase: RunPhase;
  stageLine: string;
  /** "Researched as: <product> (<domain>)", once the resolve stage has said what it is researching. */
  researchedAs: string | null;
  meters: ReactNode;
};

export function RunHeader({ appName, slug, phase, stageLine, researchedAs, meters }: RunHeaderProps): ReactElement {
  return (
    <div className="sticky top-0 z-30 border-b border-rule bg-paper">
      <PageContainer className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3">
        <h1 className="min-w-0 text-ink">
          <AppIdentity name={appName ?? "This app"} slug={slug ?? ""} size="md" />
        </h1>
        <RunStatusPill phase={phase} />
        <p role="status" className="text-small text-ink-muted">
          {stageLine}
        </p>
        {/* On a phone the meters share the second line with the stage; from the tablet width they sit at the right. */}
        <div className="ml-auto">{meters}</div>
        {researchedAs && <p className="basis-full text-small text-ink-muted">{researchedAs}</p>}
      </PageContainer>
    </div>
  );
}
