/**
 * File: check-guide.ts
 * Purpose: The library check, run by code before a guide is exported or seeded: it parses, has full coverage, no Sourced or Tested claim without an official source, no scope name that fails the scope rules, and only https sources. It never changes a guide.
 * Exports: checkLibraryGuide, LibraryFinding, LibraryRule, LibraryCheck
 * Used by: library/read-library.ts, library/export-guides.ts
 */
import { GuideSchema, type Claim, type Guide } from "@stamp/schema";
import { looksLikeScopeName } from "../agent/extract/scope-checks.js";
import { collectClaims, countLabels } from "../agent/label-counts.js";

export type LibraryRule =
  | "schema"
  | "mode"
  | "slug"
  | "asof"
  | "coverage"
  | "official_source"
  | "scope_name"
  | "https";

/** One reason a guide fails the check; `claimId` points at the claim or scope when there is one. */
export type LibraryFinding = {
  rule: LibraryRule;
  claimId?: string;
  message: string;
};

/** `guide` is set only when the input parsed; `notes` never fail a guide, they are for the owner's review. */
export type LibraryCheck = {
  guide: Guide | null;
  failures: LibraryFinding[];
  notes: string[];
};

const MAX_SCHEMA_ISSUES = 3;

function schemaFailures(error: {
  issues: { path: PropertyKey[]; message: string }[];
}): LibraryFinding[] {
  return error.issues.slice(0, MAX_SCHEMA_ISSUES).map((issue) => ({
    rule: "schema",
    message: `${issue.path.map(String).join(".") || "guide"}: ${issue.message}`,
  }));
}

/** A claim the guide states as researched (Sourced or Tested) must stand on at least one official page. */
function officialSourceFailures(claims: readonly Claim[]): LibraryFinding[] {
  return claims
    .filter(
      (claim) =>
        claim.label !== "uncertain" &&
        !claim.sources.some((source) => source.tier === "official"),
    )
    .map((claim) => ({
      rule: "official_source",
      claimId: claim.id,
      message: `${claim.label} claim with no official source`,
    }));
}

/**
 * A scope passes when its name fits the scope rules on at least one page it cites; a scope that cites none is judged on
 * its name alone. The page text is not kept, so "written on the page" was proven by the run that saved the guide.
 */
function scopeFailures(guide: Guide): LibraryFinding[] {
  const nameOnly = {
    url: `https://${guide.domain}/`,
    tier: "official",
  } as const;
  return guide.scopes
    .filter((scope) => {
      const pages =
        scope.reason.sources.length > 0 ? scope.reason.sources : [nameOnly];
      return !pages.some((page) => looksLikeScopeName(scope.name, page));
    })
    .map((scope) => ({
      rule: "scope_name",
      claimId: scope.id,
      message: `"${scope.name}" is not a scope name by the scope rules`,
    }));
}

function httpsFailures(claims: readonly Claim[]): LibraryFinding[] {
  return claims.flatMap((claim) =>
    claim.sources
      .filter((source) => new URL(source.url).protocol !== "https:")
      .map(() => ({
        rule: "https" as const,
        claimId: claim.id,
        message: "source is not an https page",
      })),
  );
}

function notesFor(guide: Guide): string[] {
  const counts = countLabels(guide);
  const share = Math.round(
    (100 * counts.uncertain) / Math.max(counts.claims, 1),
  );
  const notes = [
    `${counts.uncertain} of ${counts.claims} claims are Uncertain (${share}%)`,
  ];
  if (guide.archetype === "unknown") {
    notes.push("Not rated: the review gate is not verified");
  }
  if (guide.scopes.length === 0) notes.push("no scopes listed");
  return notes;
}

/** Checks one guide read from the file named `<fileSlug>.json`; the input may be any parsed JSON. */
export function checkLibraryGuide(
  input: unknown,
  fileSlug: string,
): LibraryCheck {
  const parsed = GuideSchema.safeParse(input);
  if (!parsed.success) {
    return { guide: null, failures: schemaFailures(parsed.error), notes: [] };
  }
  const guide = parsed.data;
  // The guide parsed, so every claim-shaped node in it is a Claim.
  const claims = collectClaims(guide) as Claim[];
  const failures: LibraryFinding[] = [];
  if (guide.slug !== fileSlug) {
    failures.push({
      rule: "slug",
      message: `slug "${guide.slug}" is not the file name "${fileSlug}"`,
    });
  }
  if (Number.isNaN(Date.parse(guide.asOf))) {
    failures.push({
      rule: "asof",
      message: `asOf "${guide.asOf}" is not a date`,
    });
  }
  if (guide.coverage !== "full") {
    failures.push({ rule: "coverage", message: "coverage is partial" });
  }
  failures.push(
    ...officialSourceFailures(claims),
    ...scopeFailures(guide),
    ...httpsFailures(claims),
  );
  return { guide, failures, notes: notesFor(guide) };
}
