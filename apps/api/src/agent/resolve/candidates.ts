/**
 * File: candidates.ts
 * Purpose: Scores the domains in a name search by how likely each is the app's official site.
 * Exports: rankCandidates, labelMatch, SCORE_WEIGHTS, Candidate, Match; re-exports looksLikeDocs, parseHit, SNIPPET_WINDOW, ResolveHit from hit-evidence.ts
 * Used by: agent/resolve/decide.ts, agent/nodes/resolve.ts
 */
import { textKey } from "../../utils/name-key.js";
import {
  domainLabel,
  registrableDomain,
} from "../../utils/registrable-domain.js";
import { DENY_DOMAINS } from "./denylist.js";
import {
  MIN_LATIN_NAME_LENGTH,
  SNIPPET_WINDOW,
  looksLikeDocs,
  mentionsName,
  minKeyLength,
  parseHit,
  type ResolveHit,
} from "./hit-evidence.js";

export { SNIPPET_WINDOW, looksLikeDocs, parseHit, type ResolveHit };

/** How the app's name relates to a domain: its brand label equals/contains it, or only a page (its title, address or start) mentions it. */
export type Match = "exact" | "partial" | "title" | "none";

export type Candidate = {
  /** Registrable domain, for example "notion.com". */
  domain: string;
  /** Brand label, for example "notion". */
  label: string;
  match: Match;
  score: number;
  hits: number;
  /** True when at least one of its hits looks like developer documentation. */
  docs: boolean;
};

/** Default weights. Search rank adds 1/(position + 1) per hit; tune these against real searches. */
export const SCORE_WEIGHTS = {
  /** A domain whose brand label is the app's name (dropbox.com for "Dropbox"): the strongest sign, worth more than a docs host and good search positions together. */
  exact: 4.5,
  partial: 1.5,
  title: 1,
  docsHintPerHit: 0.5,
  docsHintCap: 1,
  /** Shortest name or label that may partly match the other ("art" must not match "smart"). */
  minPartialLength: MIN_LATIN_NAME_LENGTH,
} as const;

/** Exact when the keys are equal; partial when one contains the other and is long enough to mean something. */
export function labelMatch(
  name: string,
  label: string,
): "exact" | "partial" | "none" {
  if (name === "" || label === "") {
    return "none";
  }
  if (name === label) {
    return "exact";
  }
  const min = SCORE_WEIGHTS.minPartialLength;
  const labelInName = label.length >= min && name.includes(label);
  const nameInLabel = name.length >= min && label.includes(name);
  return labelInName || nameInLabel ? "partial" : "none";
}

type Group = {
  domain: string;
  label: string;
  labelMatch: "exact" | "partial" | "none";
  position: number;
  docs: number;
  titleMatch: boolean;
  hits: number;
};

/**
 * Domains from the search hits, best first. Hits on denied sites are ignored unless the app's name is the
 * site's own name, or the hit is a documentation page that names the app (developers.facebook.com for Instagram). A domain's score adds up its hits' search positions, a bonus for docs-looking pages,
 * and a bonus for how well its brand label matches the name.
 */
export function rankCandidates(name: string, hits: ResolveHit[]): Candidate[] {
  const key = textKey(name);
  const mentionOk = key.length >= minKeyLength(key);
  const groups = new Map<string, Group>();

  hits.forEach((hit, index) => {
    const parsed = parseHit(hit.url);
    if (!parsed) {
      return;
    }
    const domain = registrableDomain(parsed.hostname);
    const label = domainLabel(parsed.hostname);
    const match = labelMatch(key, textKey(label));
    const mentioned = mentionOk && mentionsName(parsed, hit, key);
    if (
      DENY_DOMAINS.has(domain) &&
      match !== "exact" &&
      !(mentioned && looksLikeDocs(parsed))
    ) {
      return;
    }
    const group = groups.get(domain) ?? {
      domain,
      label,
      labelMatch: match,
      position: 0,
      docs: 0,
      titleMatch: false,
      hits: 0,
    };
    group.position += 1 / (index + 1);
    group.hits += 1;
    if (looksLikeDocs(parsed)) {
      group.docs = Math.min(
        SCORE_WEIGHTS.docsHintCap,
        group.docs + SCORE_WEIGHTS.docsHintPerHit,
      );
    }
    if (mentioned) {
      group.titleMatch = true;
    }
    groups.set(domain, group);
  });

  const all = [...groups.values()];
  // A rival is another brand's documentation that names the app only in its page titles (developers.google.com for
  // YouTube). A domain whose label holds the name (mercuryapp.io for Mercury) is a second brand, left to the "did you mean" rule.
  const hasDocsRival = (group: Group): boolean =>
    all.some(
      (other) =>
        other !== group &&
        other.docs > 0 &&
        other.labelMatch === "none" &&
        other.titleMatch,
    );

  return all
    .map((group): Candidate => {
      const match = matchOf(group, hasDocsRival(group));
      const bonus = match === "none" ? 0 : SCORE_WEIGHTS[match];
      return {
        domain: group.domain,
        label: group.label,
        match,
        score: group.position + group.docs + bonus,
        hits: group.hits,
        docs: group.docs > 0,
      };
    })
    .sort((a, b) => b.score - a.score || a.domain.localeCompare(b.domain));
}

/**
 * How a domain matches the name. A name found only in a page title counts only when the domain has a documentation page:
 * a directory or a blog that happens to say the name is not an official site. An exact label counts in full unless it
 * has no documentation page while a rival that names the app does (youtube.com, whose one hit is a video, against
 * developers.google.com): then it counts as a title match only.
 */
function matchOf(group: Group, hasDocsRival: boolean): Match {
  if (group.labelMatch === "exact" && group.docs === 0 && hasDocsRival) {
    return "title";
  }
  if (group.labelMatch !== "none") return group.labelMatch;
  return group.titleMatch && group.docs > 0 ? "title" : "none";
}
