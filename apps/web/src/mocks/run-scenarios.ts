/**
 * File: run-scenarios.ts
 * Purpose: Builds the event list for each `?state=` of the Live run page from the HubSpot replay.
 *          Timings are mock timings, not measurements. The not-OAuth and no-docs states use generic
 *          search queries and no app name: the docs name no app that uses API keys or lacks docs.
 * Exports: RunSnapshot, getRunSnapshot
 * Used by: components/run/RunScreen.tsx
 */
import { MOCK_RUN_EVENTS } from "./run-events";
import type { RunScenario } from "./scenarios";
import type { RunEvent, TimedRunEvent } from "./types";

export type RunSnapshot = {
  events: readonly TimedRunEvent[];
  /** `running` replays over time. Every other state starts on its final frame. */
  isPlayback: boolean;
  /** Null when the run is not about a named app. */
  appName: string | null;
};

// Cut points in MOCK_RUN_EVENTS (ms): stages 0 and 1 done, two pages read, stage 4 started.
const AFTER_PLANNING = 1700;
const TWO_PAGES_READ = 5500;
const EXTRACTION_STARTED = 7400;
const TIME_LIMIT_MS = 120_000;

function upTo(atMs: number): TimedRunEvent[] {
  return MOCK_RUN_EVENTS.filter((item) => item.atMs <= atMs);
}

function at(atMs: number, event: RunEvent): TimedRunEvent {
  return { atMs, event };
}

function genericSearch(queries: readonly string[]): TimedRunEvent[] {
  return queries.map((query, index) =>
    at(2200 + index * 600, { type: "search.query", query }),
  );
}

function partial(): TimedRunEvent[] {
  // Extraction runs out the clock, so the run jumps to Save with what it has.
  return [
    ...upTo(EXTRACTION_STARTED),
    at(119_500, { type: "stage.started", stage: 8, name: "Save" }),
    at(TIME_LIMIT_MS, { type: "stage.done", stage: 8, durationMs: 500 }),
    at(TIME_LIMIT_MS, { type: "run.done", slug: "hubspot", status: "partial" }),
  ];
}

function internalError(): TimedRunEvent[] {
  return [
    ...upTo(TWO_PAGES_READ),
    at(5900, {
      type: "run.error",
      stage: 3,
      code: "INTERNAL",
      message: "The run stopped because of an error on our side.",
    }),
  ];
}

function notOauth(): TimedRunEvent[] {
  return [
    ...upTo(AFTER_PLANNING),
    at(1800, { type: "stage.started", stage: 2, name: "Search" }),
    ...genericSearch([
      "oauth app registration setup",
      "developer docs authentication",
    ]),
    at(3400, {
      type: "run.error",
      stage: 2,
      code: "NOT_OAUTH",
      message: "This app uses API keys, not OAuth.",
    }),
  ];
}

function noDocs(): TimedRunEvent[] {
  return [
    ...upTo(AFTER_PLANNING),
    at(1800, { type: "stage.started", stage: 2, name: "Search" }),
    ...genericSearch([
      "oauth app registration setup",
      "developer docs authentication",
      "oauth scopes reference",
    ]),
    at(4000, { type: "stage.done", stage: 2, durationMs: 2200 }),
    at(4100, { type: "stage.started", stage: 3, name: "Fetch pages" }),
    at(4600, {
      type: "run.error",
      stage: 3,
      code: "NO_PUBLIC_DOCS",
      message: "No public docs found.",
    }),
  ];
}

export function getRunSnapshot(scenario: RunScenario): RunSnapshot {
  switch (scenario) {
    case "running":
      return { events: MOCK_RUN_EVENTS, isPlayback: true, appName: "HubSpot" };
    case "done":
      return { events: MOCK_RUN_EVENTS, isPlayback: false, appName: "HubSpot" };
    case "partial":
      return { events: partial(), isPlayback: false, appName: "HubSpot" };
    case "error":
      return { events: internalError(), isPlayback: false, appName: "HubSpot" };
    case "not-oauth":
      return { events: notOauth(), isPlayback: false, appName: null };
    case "no-docs":
      return { events: noDocs(), isPlayback: false, appName: null };
  }
}
