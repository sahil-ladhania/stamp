/**
 * File: sample-guide-row.ts
 * Purpose: Prisma-shaped guide row for mapper unit tests.
 * Exports: sampleGuideRow
 * Used by: guide-mapper.test.ts
 */
import type { Guide as PrismaGuide } from "../../../generated/prisma/client.js";

const guideData = {
  schemaVersion: 1,
  slug: "hubspot",
  appName: "HubSpot",
  domain: "hubspot.com",
  mode: "library",
  archetype: "hidden_limits",
  difficulty: 3,
  asOf: "2026-01-15T00:00:00.000Z",
  coverage: "full",
  verdict: {
    summary: {
      id: "verdict.summary",
      text: "Summary",
      label: "sourced",
      sources: [
        {
          url: "https://example.com/docs",
          quote: "Summary",
          tier: "official",
        },
      ],
    },
    nextStepId: "steps.0",
    topBlockerId: null,
  },
  milestones: {
    firstTest: {
      effort: {
        id: "milestones.firstTest.effort",
        text: "About 1 hour",
        label: "uncertain",
        sources: [
          {
            url: "https://example.com/docs",
            quote: "About 1 hour",
            tier: "official",
          },
        ],
      },
      wait: {
        id: "milestones.firstTest.wait",
        text: "No wait",
        label: "sourced",
        sources: [
          {
            url: "https://example.com/docs",
            quote: "No wait",
            tier: "official",
          },
        ],
      },
    },
    production: {
      effort: {
        id: "milestones.production.effort",
        text: "Listing required",
        label: "sourced",
        sources: [
          {
            url: "https://example.com/docs",
            quote: "Listing required",
            tier: "official",
          },
        ],
      },
      wait: {
        id: "milestones.production.wait",
        text: "Unknown",
        label: "uncertain",
        sources: [
          {
            url: "https://example.com/docs",
            quote: "Unknown",
            tier: "official",
          },
        ],
      },
    },
  },
  requirements: [],
  scopes: [],
  steps: [],
  blockers: [],
  limits: [],
  conflicts: [],
  difficultyBreakdown: {
    reviewGate: 2,
    approvalWait: 1,
    prerequisites: 1,
    hiddenLimits: 1,
    total: 5,
    score: 3,
  },
};

/** Minimal Prisma Guide row with valid JSON data. */
export function sampleGuideRow(
  overrides: Partial<PrismaGuide> = {},
): PrismaGuide {
  const asOf = new Date("2026-01-15T00:00:00.000Z");
  return {
    id: "guide_1",
    slug: "hubspot",
    appName: "HubSpot",
    domain: "hubspot.com",
    mode: "LIBRARY",
    archetype: "HIDDEN_LIMITS",
    difficulty: 3,
    data: guideData,
    asOf,
    expiresAt: null,
    createdAt: asOf,
    updatedAt: asOf,
    ...overrides,
  };
}
