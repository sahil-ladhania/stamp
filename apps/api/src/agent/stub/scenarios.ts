/**
 * File: scenarios.ts
 * Purpose: Picks the stub agent scenario from the run's slug (the app name the tester typed).
 * Exports: scenarioFor, StubScenario
 * Used by: agent/stub/script.ts, agent/stub/run-stub-agent.ts
 */

export type StubScenario =
  "default" | "error" | "partial" | "ambiguous" | "notoauth";

// A Map, so slugs like "constructor" can never match an inherited property.
const SCENARIOS_BY_SLUG = new Map<string, StubScenario>([
  ["stub-error", "error"],
  ["stub-partial", "partial"],
  ["stub-ambiguous", "ambiguous"],
  ["stub-notoauth", "notoauth"],
]);

/** "stub-error", "Stub Error" and "STUB-ERROR" all slugify to the same scenario; anything else is the default run. */
export function scenarioFor(slug: string): StubScenario {
  return SCENARIOS_BY_SLUG.get(slug) ?? "default";
}
