/**
 * File: library-guide.ts
 * Purpose: A small valid library guide and claim builders, for the library check, export and seed tests.
 * Exports: claim, libraryGuide, official, thirdParty
 * Used by: library/*.test.ts, services/library-seed.test.ts
 */
import type { Claim, Guide, Source } from "@stamp/schema";

export const official: Source = {
  url: "https://docs.example.com/oauth",
  quote: "A verbatim quote.",
  tier: "official",
};
export const thirdParty: Source = {
  url: "https://blog.example.net/oauth",
  quote: "A verbatim quote.",
  tier: "third_party",
};

/** A Sourced claim on one official page unless told otherwise. */
export const claim = (
  id: string,
  label: Claim["label"] = "sourced",
  sources: Source[] = [official],
): Claim => ({ id, text: "A claim.", label, sources });

const unknown = (id: string): Claim => ({
  id,
  text: "Not found in the fetched sources.",
  label: "uncertain",
  sources: [],
});

/** A full, rated guide in which every Sourced claim stands on an official page. */
export function libraryGuide(overrides: Partial<Guide> = {}): Guide {
  return {
    schemaVersion: 1,
    slug: "acme",
    appName: "Acme",
    domain: "docs.example.com",
    mode: "live",
    archetype: "hidden_limits",
    difficulty: 3,
    asOf: "2026-10-29T18:54:47.447Z",
    coverage: "full",
    verdict: {
      summary: claim("verdict.summary"),
      nextStepId: "steps.0",
      topBlockerId: null,
    },
    milestones: {
      firstTest: {
        effort: unknown("milestones.firstTest.effort"),
        wait: unknown("milestones.firstTest.wait"),
      },
      production: {
        effort: unknown("milestones.production.effort"),
        wait: unknown("milestones.production.wait"),
      },
    },
    requirements: [claim("requirements.0")],
    scopes: [
      { id: "scopes.0", name: "chat:write", reason: claim("scopes.0.reason") },
    ],
    steps: [
      {
        id: "steps.0",
        title: "Register the app",
        detail: claim("steps.0.detail"),
        actor: "human",
        effort: unknown("steps.0.effort"),
      },
    ],
    blockers: [],
    limits: [unknown("limits.0")],
    conflicts: [],
    difficultyBreakdown: {
      reviewGate: 2,
      approvalWait: 1,
      prerequisites: 0,
      hiddenLimits: 1,
      total: 4,
      score: 3,
    },
    ...overrides,
  };
}
