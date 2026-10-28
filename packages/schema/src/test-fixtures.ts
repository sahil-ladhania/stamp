/**
 * File: test-fixtures.ts
 * Purpose: Minimal valid objects for schema contract tests (not production fixtures).
 * Exports: minimalClaim, minimalGuide
 * Used by: schema package vitest files
 */
import type { Claim } from "./claim.js";
import type { Guide } from "./guide/guide.js";
import { SCHEMA_VERSION } from "./constants.js";

export function minimalClaim(overrides: Partial<Claim> = {}): Claim {
  return {
    id: "steps.0",
    text: "Create a developer account.",
    label: "sourced",
    sources: [
      {
        url: "https://example.com/docs",
        quote: "Create a developer account",
        tier: "official",
      },
    ],
    ...overrides,
  };
}

/** Builds a minimal valid Guide for tests. */
export function minimalGuide(overrides: Partial<Guide> = {}): Guide {
  const claim = minimalClaim();
  return {
    schemaVersion: SCHEMA_VERSION,
    slug: "hubspot",
    appName: "HubSpot",
    domain: "hubspot.com",
    mode: "library",
    archetype: "hidden_limits",
    difficulty: 3,
    asOf: "2026-01-15T00:00:00.000Z",
    coverage: "full",
    verdict: {
      summary: minimalClaim({ id: "verdict.summary" }),
      nextStepId: "steps.0",
      topBlockerId: "blockers.0",
    },
    milestones: {
      firstTest: {
        effort: minimalClaim({ id: "milestones.firstTest.effort" }),
        wait: minimalClaim({ id: "milestones.firstTest.wait", label: "uncertain" }),
      },
      production: {
        effort: minimalClaim({ id: "milestones.production.effort" }),
        wait: minimalClaim({ id: "milestones.production.wait", label: "uncertain" }),
      },
    },
    requirements: [minimalClaim({ id: "requirements.0" })],
    scopes: [
      {
        id: "scopes.0",
        name: "crm.objects.contacts.read",
        reason: minimalClaim({ id: "scopes.0.reason" }),
      },
    ],
    steps: [
      {
        id: "steps.0",
        title: "Create a developer account",
        detail: claim,
        actor: "human",
        effort: minimalClaim({ id: "steps.0.effort" }),
      },
    ],
    blockers: [
      {
        id: "blockers.0",
        symptom: minimalClaim({ id: "blockers.0.symptom" }),
        cause: minimalClaim({ id: "blockers.0.cause" }),
        fix: minimalClaim({ id: "blockers.0.fix" }),
        contact: null,
      },
    ],
    limits: [minimalClaim({ id: "limits.0" })],
    conflicts: [],
    difficultyBreakdown: {
      reviewGate: 2,
      approvalWait: 1,
      prerequisites: 1,
      hiddenLimits: 1,
      total: 5,
      score: 3,
    },
    ...overrides,
  };
}
