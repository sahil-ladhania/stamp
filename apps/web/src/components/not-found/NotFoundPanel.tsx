/**
 * File: NotFoundPanel.tsx
 * Purpose: The whole Not found layout: message, the likeliest next step, search, library, and the address stamp.
 *          Reused by the Guide page for an unknown slug.
 * Exports: NotFoundPanel
 * Used by: pages/NotFoundPage.tsx, Guide page (step 6)
 */
import type { ReactElement } from "react";
import { Link } from "react-router";
import { ResultStamp } from "@/components/guide/ResultStamp";
import { Container } from "@/components/layout/Container";
import { ExampleApps } from "@/components/shared/ExampleApps";
import { SearchBar } from "@/components/shared/SearchBar";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { buttonVariants } from "@/components/ui/button-variants";
import { useMockSearch } from "@/hooks/useMockSearch";
import { LIBRARY_SUMMARIES } from "@/mocks/library";
import { getSearchPrefill, type NotFoundHint } from "@/utils/not-found-hint";
import { getNotFoundCopy } from "./not-found-copy";

type NotFoundPanelProps = { path: string; hint: NotFoundHint };

export function NotFoundPanel({
  path,
  hint,
}: NotFoundPanelProps): ReactElement {
  const { submit } = useMockSearch();
  const copy = getNotFoundCopy(hint);
  const prefill = getSearchPrefill(path, hint);

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
            <Link
              to={copy.action.to}
              className={buttonVariants({ size: "lg" })}
            >
              {copy.action.label}
            </Link>
          </div>
        )}
        <div className="flex flex-col gap-3">
          <p className="text-body text-ink">{copy.searchPrompt}</p>
          {/* Keyed so the box restarts with the new guess when the address changes. */}
          <SearchBar
            key={`${hint.kind}:${prefill}`}
            onSubmit={submit}
            defaultValue={prefill}
            placeholder="Search an app, like HubSpot"
            buttonVariant={copy.action ? "secondary" : "primary"}
          />
        </div>
        <ExampleApps apps={LIBRARY_SUMMARIES} />
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
