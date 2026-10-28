/**
 * File: Hero.tsx
 * Purpose: Landing hero: the problem and search on the left, the demo video on the right.
 * Exports: Hero
 * Used by: pages/LandingPage.tsx
 */
import type { ReactElement } from "react";
import { Container } from "@/components/layout/Container";
import { ExampleApps } from "@/components/shared/ExampleApps";
import { SearchBar } from "@/components/shared/SearchBar";
import { useMockSearch } from "@/hooks/useMockSearch";
import { LIBRARY_SUMMARIES } from "@/mocks/guides";
import { HeroVideo } from "./HeroVideo";

type HeroProps = { isVideoFailed?: boolean };

export function Hero({ isVideoFailed = false }: HeroProps): ReactElement {
  const { submit } = useMockSearch();

  return (
    <section aria-labelledby="hero-heading" className="py-12">
      <Container
        size="wide"
        className="grid gap-12 desktop:grid-cols-12 desktop:items-center"
      >
        <div className="flex flex-col gap-6 desktop:col-span-5">
          <h1
            id="hero-heading"
            className="text-page-title tracking-tight text-balance text-ink tablet:text-display"
          >
            One hour or six weeks?
          </h1>
          <p className="text-card-title font-normal text-ink-muted">
            Docs list the clicks and hide the wait. Stamp shows how hard it is
            to get your provider OAuth app approved, how long it takes and what
            blocks it. Every claim has a source.
          </p>
          <SearchBar
            size="lg"
            onSubmit={submit}
            placeholder="Search an app, like HubSpot"
          />
          <div className="flex flex-col gap-3">
            <ExampleApps apps={LIBRARY_SUMMARIES} />
            <p className="text-small text-ink-muted">
              Any other app is researched live. You watch it happen.
            </p>
          </div>
        </div>
        <div className="desktop:col-span-7">
          <HeroVideo isForcedFailure={isVideoFailed} />
        </div>
      </Container>
    </section>
  );
}
