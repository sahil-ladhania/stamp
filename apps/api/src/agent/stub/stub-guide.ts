/**
 * File: stub-guide.ts
 * Purpose: Builds the clearly marked placeholder guide the stub agent saves (example.com sources, no provider facts).
 * Exports: buildStubGuide, listClaims, stubPages, STUB_SUMMARY, STUB_MARKER, STUB_APP_SUFFIX, STUB_DOMAIN, StubPage
 * Used by: agent/stub/script.ts, agent/stub/run-stub-agent.ts
 */
import {
  SCHEMA_VERSION,
  difficultyScoreForTotal,
  type Claim,
  type EvidenceLabel,
  type Guide,
  type SourceTier,
} from "@stamp/schema";

export const STUB_DOMAIN = "example.com";
export const STUB_MARKER = "[STUB]";
export const STUB_APP_SUFFIX = "(stub data)";
export const STUB_SUMMARY = "Stub guide: scripted test data, not real research";

export type StubPage = { url: string; tier: SourceTier };

/** The five pages the stub "fetches"; every guide source points at one of them. */
export function stubPages(slug: string): StubPage[] {
  return [
    {
      url: `https://docs.example.com/stub/${slug}/oauth/overview`,
      tier: "official",
    },
    {
      url: `https://docs.example.com/stub/${slug}/oauth/scopes`,
      tier: "official",
    },
    {
      url: `https://docs.example.com/stub/${slug}/apps/review`,
      tier: "official",
    },
    {
      url: `https://example.net/stub/${slug}/setup-guide`,
      tier: "third_party",
    },
    {
      url: `https://forum.example.org/stub/${slug}/install-limits`,
      tier: "forum",
    },
  ];
}

function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

type ClaimSpec = {
  id: string;
  label: EvidenceLabel;
  page: number;
  text?: string;
};

/** Builds one placeholder claim; its text carries the stub marker and its source is a stub page. */
function claim(spec: ClaimSpec, pages: StubPage[]): Claim {
  const body = spec.text ?? `Placeholder text for ${spec.id}.`;
  const page = pages[spec.page] ?? pages[0];
  return {
    id: spec.id,
    text: `${STUB_MARKER} ${body}`,
    label: spec.label,
    sources: [
      { url: page?.url ?? "", quote: body, tier: page?.tier ?? "official" },
    ],
  };
}

/**
 * A full guide, or a partial one where blockers and limits ran out of time budget.
 * Labels are only sourced or uncertain: nothing in a stub is ever tested.
 */
export function buildStubGuide(options: {
  slug: string;
  partial: boolean;
  asOf: Date;
}): Guide {
  const { slug, partial } = options;
  const pages = stubPages(slug);
  const c = (
    id: string,
    label: EvidenceLabel,
    page: number,
    text?: string,
  ): Claim => claim({ id, label, page, text }, pages);
  const late = partial ? "uncertain" : "sourced";
  const lateText = partial
    ? "Not researched before the time budget ran out."
    : undefined;
  const step = (
    n: number,
    actor: "human" | "agent_assist" | "agent",
    page: number,
  ) => ({
    id: `steps.${n}`,
    title: `Stub step ${n + 1}: placeholder title`,
    detail: c(`steps.${n}.detail`, "sourced", page),
    actor,
    effort: c(`steps.${n}.effort`, "uncertain", 2),
  });

  return {
    schemaVersion: SCHEMA_VERSION,
    slug,
    appName: `${titleFromSlug(slug)} ${STUB_APP_SUFFIX}`,
    domain: STUB_DOMAIN,
    mode: "live",
    archetype: "unknown",
    difficulty: difficultyScoreForTotal(3),
    asOf: options.asOf.toISOString(),
    coverage: partial ? "partial" : "full",
    verdict: {
      // The summary is the one claim without the marker prefix: its text is the marker.
      summary: {
        id: "verdict.summary",
        text: STUB_SUMMARY,
        label: "uncertain",
        sources: [
          { url: pages[0]?.url ?? "", quote: STUB_SUMMARY, tier: "official" },
        ],
      },
      nextStepId: "steps.0",
      topBlockerId: "blockers.0",
    },
    milestones: {
      firstTest: {
        effort: c("milestones.firstTest.effort", "uncertain", 2),
        wait: c("milestones.firstTest.wait", "uncertain", 2),
      },
      production: {
        effort: c("milestones.production.effort", "uncertain", 2),
        wait: c("milestones.production.wait", "uncertain", 2),
      },
    },
    requirements: [c("requirements.0", "sourced", 0)],
    scopes: [
      {
        id: "scopes.0",
        name: "stub.scope.read",
        reason: c("scopes.0.reason", "sourced", 1),
      },
    ],
    steps: [
      step(0, "human", 0),
      step(1, "agent_assist", 1),
      step(2, "agent", 3),
    ],
    blockers: [
      {
        id: "blockers.0",
        symptom: c("blockers.0.symptom", late, 4, lateText),
        cause: c("blockers.0.cause", late, 2, lateText),
        fix: c("blockers.0.fix", late, 3, lateText),
        contact: null,
      },
    ],
    limits: [c("limits.0", "uncertain", 4, partial ? lateText : undefined)],
    conflicts: [],
    difficultyBreakdown: {
      reviewGate: 1,
      approvalWait: 1,
      prerequisites: 1,
      hiddenLimits: 0,
      total: 3,
      score: difficultyScoreForTotal(3),
    },
  };
}

/** Every claim in the guide, so the script can announce them by id and source URL. */
export function listClaims(guide: Guide): Claim[] {
  return [
    guide.verdict.summary,
    guide.milestones.firstTest.effort,
    guide.milestones.firstTest.wait,
    guide.milestones.production.effort,
    guide.milestones.production.wait,
    ...guide.requirements,
    ...guide.scopes.map((scope) => scope.reason),
    ...guide.steps.flatMap((step) => [step.detail, step.effort]),
    ...guide.blockers.flatMap((b) => [b.symptom, b.cause, b.fix]),
    ...guide.limits,
  ];
}
