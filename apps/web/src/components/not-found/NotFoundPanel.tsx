/**
 * File: NotFoundPanel.tsx
 * Purpose: The whole Not found layout: message, the likeliest next step, search, library links, and the address stamp.
 *          It loads the library list itself, so the suggestion and the example links appear only when the list does.
 *          Reused by the Guide page for an unknown slug.
 * Exports: NotFoundPanel
 * Used by: pages/NotFoundPage.tsx, pages/GuidePage.tsx
 */
import type { ReactElement } from "react";
import { Link } from "react-router";
import { ResultStamp } from "@/components/guide/ResultStamp";
import { Container } from "@/components/layout/Container";
import { ExampleApps } from "@/components/shared/ExampleApps";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { StartRunSearch } from "@/components/shared/StartRunSearch";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { useGuides } from "@/hooks/useGuides";
import { useStartRun } from "@/hooks/useStartRun";
import { getApiErrorMessage } from "@/utils/error-messages";
import { getNotFoundHint, getSearchPrefill } from "@/utils/not-found-hint";
import { getNotFoundCopy } from "./not-found-copy";

export function NotFoundPanel({ path }: { path: string }): ReactElement {
  const { data } = useGuides();
  const guides = data ?? [];
  const hint = getNotFoundHint(path, guides);
  const copy = getNotFoundCopy(hint);
  const prefill = getSearchPrefill(path, hint);
  const { start, isPending, error } = useStartRun();

  return (
    <Container className="grid gap-12 py-12 desktop:grid-cols-12 desktop:items-start">
      <div className="flex flex-col gap-6 desktop:col-span-7">
        <SectionHeading
          level={1}
          title={copy.heading}
          description={copy.lead}
        />
        {copy.action && (
          <div className="flex flex-col items-start gap-3">
            {copy.question && (
              <p className="text-card-title text-ink">{copy.question}</p>
            )}
            {copy.action.kind === "link" ? (
              <Link
                to={copy.action.to}
                className={buttonVariants({ size: "lg" })}
              >
                {copy.action.label}
              </Link>
            ) : (
              <Button
                size="lg"
                disabled={isPending}
                onClick={() =>
                  copy.action?.kind === "research" &&
                  void start(copy.action.app)
                }
              >
                {copy.action.label}
              </Button>
            )}
            {error && (
              <p role="alert" className="text-small text-ink">
                {getApiErrorMessage(error)}
              </p>
            )}
          </div>
        )}
        <div className="flex flex-col gap-3">
          <p className="text-body text-ink">{copy.searchPrompt}</p>
          {/* Keyed so the box restarts with the new guess when the address changes. */}
          <StartRunSearch
            key={`${hint.kind}:${prefill}`}
            defaultValue={prefill}
            placeholder="Search an app, like HubSpot"
            buttonVariant={copy.action ? "secondary" : "primary"}
          />
        </div>
        {guides.length > 0 && <ExampleApps apps={guides} />}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link to="/app" className={buttonVariants({ variant: "secondary" })}>
            Open the library
          </Link>
          <Link
            to="/"
            className="text-body text-sourced underline underline-offset-4"
          >
            Go to the home page
          </Link>
        </div>
      </div>
      <div className="desktop:col-span-5">
        <ResultStamp
          label="Page lookup result"
          title={path}
          subtitle="Page lookup"
          isTitleMono
          rows={copy.stampRows}
        />
      </div>
    </Container>
  );
}
