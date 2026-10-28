/**
 * File: sanitize.ts
 * Purpose: Cleans a section's model output: drops every claim whose URL was not fetched in this run, and rewrites kept URLs to the page's own.
 * Exports: sanitizeSection, indexPages, pageFor, PageIndex, SanitizeContext, Cleaned
 * Used by: agent/extract/run-section.ts
 */
import { hashUrl } from "../../utils/hash-url.js";
import type { DraftClaim } from "../draft-claim.js";
import type { PageRecord } from "../page-record.js";
import { withoutUnevidencedFacts } from "./gates-normalize.js";
import type { SectionId, SectionOutput } from "./sections.js";

/** The pages fetched in this run, by URL hash: the only sources a claim may cite. */
export type PageIndex = ReadonlyMap<string, PageRecord>;

export type SanitizeContext = {
  pages: PageIndex;
  /** Lengths of the lists the verdict's indexes point into. */
  stepCount?: number;
  blockerCount?: number;
};

export type Cleaned<T> = { output: T; dropped: number };

export function indexPages(pages: readonly PageRecord[]): PageIndex {
  return new Map(pages.map((page) => [page.urlHash, page]));
}

export function pageFor(url: string, pages: PageIndex): PageRecord | undefined {
  try {
    return pages.get(hashUrl(url));
  } catch {
    return undefined; // not an http(s) URL, so not a fetched page
  }
}

/** Keeps claims whose URL is a fetched page, with the URL replaced by that page's own; counts the ones it drops. */
function keeper(pages: PageIndex) {
  let dropped = 0;
  const claim = (draft: DraftClaim | null): DraftClaim | null => {
    if (draft === null) return null;
    const page = pageFor(draft.url, pages);
    if (!page) {
      dropped += 1;
      return null;
    }
    return { ...draft, url: page.url };
  };
  const all = (drafts: DraftClaim[]): DraftClaim[] =>
    drafts.flatMap((draft) => claim(draft) ?? []);
  return { claim, all, dropped: () => dropped };
}

type Cleaner<K extends SectionId> = (
  output: SectionOutput<K>,
  context: SanitizeContext,
) => Cleaned<SectionOutput<K>>;

const steps: Cleaner<"steps"> = (output, { pages }) => {
  const k = keeper(pages);
  const kept = output.steps.flatMap((step) => {
    const detail = k.claim(step.detail);
    return detail ? [{ ...step, detail, effort: k.claim(step.effort) }] : [];
  });
  return { output: { steps: kept }, dropped: k.dropped() };
};

const scopes: Cleaner<"scopes"> = (output, { pages }) => {
  const k = keeper(pages);
  const kept = output.scopes.flatMap((scope) => {
    const reason = k.claim(scope.reason);
    return reason ? [{ ...scope, reason }] : [];
  });
  return { output: { scopes: kept }, dropped: k.dropped() };
};

const requirements: Cleaner<"requirements"> = (output, { pages }) => {
  const k = keeper(pages);
  return {
    output: { requirements: k.all(output.requirements) },
    dropped: k.dropped(),
  };
};

const limits: Cleaner<"limits"> = (output, { pages }) => {
  const k = keeper(pages);
  return { output: { limits: k.all(output.limits) }, dropped: k.dropped() };
};

const blockers: Cleaner<"blockers"> = (output, { pages }) => {
  const k = keeper(pages);
  const kept = output.blockers.flatMap((blocker) => {
    const symptom = k.claim(blocker.symptom);
    if (!symptom) return [];
    return [
      {
        symptom,
        cause: k.claim(blocker.cause),
        fix: k.claim(blocker.fix),
        contact: k.claim(blocker.contact),
      },
    ];
  });
  return { output: { blockers: kept }, dropped: k.dropped() };
};

const milestones: Cleaner<"milestones"> = (output, { pages }) => {
  const k = keeper(pages);
  return {
    output: {
      firstTestEffort: k.claim(output.firstTestEffort),
      firstTestWait: k.claim(output.firstTestWait),
      productionEffort: k.claim(output.productionEffort),
      productionWait: k.claim(output.productionWait),
    },
    dropped: k.dropped(),
  };
};

const conflicts: Cleaner<"conflicts"> = (output, { pages }) => {
  const k = keeper(pages);
  const kept = output.conflicts.flatMap((conflict) => {
    const sourceA = k.claim(conflict.sourceA);
    const sourceB = k.claim(conflict.sourceB);
    const reason = k.claim(conflict.reason);
    const preferred = pageFor(conflict.preferredUrl, pages);
    return sourceA && sourceB && reason && preferred
      ? [{ ...conflict, sourceA, sourceB, reason, preferredUrl: preferred.url }]
      : [];
  });
  return { output: { conflicts: kept }, dropped: k.dropped() };
};

const verdict: Cleaner<"verdict"> = (output, context) => {
  const k = keeper(context.pages);
  const inRange = (
    index: number | null,
    count: number | undefined,
  ): number | null => (index !== null && index < (count ?? 0) ? index : null);
  return {
    output: {
      summary: k.claim(output.summary),
      nextStepIndex: inRange(output.nextStepIndex, context.stepCount),
      topBlockerIndex: inRange(output.topBlockerIndex, context.blockerCount),
    },
    dropped: k.dropped(),
  };
};

/** A fact whose evidence was dropped is unknown: it has no checked source, so it must not count. */
const gates: Cleaner<"gates"> = (output, { pages }) => {
  const k = keeper(pages);
  const cleaned = withoutUnevidencedFacts({
    ...output,
    authEvidence: k.claim(output.authEvidence),
    reviewGateEvidence: k.claim(output.reviewGateEvidence),
    approvalWaitEvidence: k.claim(output.approvalWaitEvidence),
    prerequisites: k.all(output.prerequisites),
    hiddenLimits: k.all(output.hiddenLimits),
    enterprisePlanEvidence: k.claim(output.enterprisePlanEvidence),
  });
  return { output: cleaned, dropped: k.dropped() };
};

const CLEANERS: { [K in SectionId]: Cleaner<K> } = {
  steps,
  scopes,
  requirements,
  blockers,
  milestones,
  gates,
  limits,
  conflicts,
  verdict,
};

/** Cleans one section's validated model output; the input is not changed. */
export function sanitizeSection<K extends SectionId>(
  section: K,
  output: SectionOutput<K>,
  context: SanitizeContext,
): Cleaned<SectionOutput<K>> {
  return (CLEANERS[section] as Cleaner<K>)(output, context);
}
