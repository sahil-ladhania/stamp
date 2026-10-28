/**
 * File: LookupSection.tsx
 * Purpose: Top of App home: heading, the search, and the paused notice or "Did you mean" panel when they apply.
 * Exports: LookupSection
 * Used by: pages/AppHomePage.tsx
 */
import { useState, type ReactElement } from "react";
import { Container } from "@/components/layout/Container";
import { SearchBar } from "@/components/shared/SearchBar";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { useMockSearch } from "@/hooks/useMockSearch";
import { AMBIGUOUS_OPTIONS, AMBIGUOUS_QUERY } from "@/mocks/ambiguous";
import { findLibrarySlug } from "@/mocks/guides";
import type { AppHomeScenario } from "@/mocks/scenarios";
import { AmbiguousOptions } from "./AmbiguousOptions";
import { PausedNotice } from "./PausedNotice";

const PAUSED_MISS_MESSAGE = "Live generation paused. Try a library guide.";

/** Keyed by the page on `scenario`, so the message and the search box reset when the state changes. */
export function LookupSection({
  scenario,
}: {
  scenario: AppHomeScenario;
}): ReactElement {
  const { submit } = useMockSearch();
  const [message, setMessage] = useState<string | null>(null);
  const isPaused = scenario === "paused";
  const isAmbiguous = scenario === "ambiguous";

  function handleSubmit(app: string): void {
    // While paused, only library names can open a guide. Anything else would start a live run.
    if (isPaused && !findLibrarySlug(app)) {
      setMessage(PAUSED_MISS_MESSAGE);
      return;
    }
    setMessage(null);
    submit(app);
  }

  return (
    <Container className="flex flex-col gap-6 py-12">
      <SectionHeading
        level={1}
        title="Look up an app"
        description="Search any app by name or website. Or open one of the five library guides, sorted by difficulty."
      />
      {isPaused && <PausedNotice />}
      <SearchBar
        size="lg"
        onSubmit={handleSubmit}
        defaultValue={isAmbiguous ? AMBIGUOUS_QUERY : ""}
        placeholder="Search an app, like HubSpot"
      />
      {/* Always rendered so screen readers announce the text when it appears. */}
      <p role="status" className={message ? "text-small text-ink" : "sr-only"}>
        {message}
      </p>
      {isAmbiguous && (
        <AmbiguousOptions query={AMBIGUOUS_QUERY} options={AMBIGUOUS_OPTIONS} />
      )}
    </Container>
  );
}
