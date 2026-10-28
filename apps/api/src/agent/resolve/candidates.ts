/**
 * File: candidates.ts
 * Purpose: Scores the domains in a name search by how likely each is the app's official site.
 * Exports: rankCandidates, labelMatch, SCORE_WEIGHTS, Candidate, Match, ResolveHit
 * Used by: agent/resolve/decide.ts, agent/nodes/resolve.ts
 */
import { nameKey } from "../../utils/name-key.js";
import {
  domainLabel,
  registrableDomain,
} from "../../utils/registrable-domain.js";
import { DENY_DOMAINS, DOCS_HOST_LABELS, DOCS_PATH_HINT } from "./denylist.js";

export type ResolveHit = { url: string; title: string };

/** How the app's name relates to a domain: its brand label equals/contains it, or only a page title mentions it. */
export type Match = "exact" | "partial" | "title" | "none";

export type Candidate = {
  /** Registrable domain, for example "notion.com". */
  domain: string;
  /** Brand label, for example "notion". */
  label: string;
  match: Match;
  score: number;
  hits: number;
};

/** Default weights. Search rank adds 1/(position + 1) per hit; tune these against real searches. */
export const SCORE_WEIGHTS = {
  exact: 3,
  partial: 1.5,
  title: 1,
  docsHintPerHit: 0.5,
  docsHintCap: 1,
  /** Shortest name or label that may partly match the other ("art" must not match "smart"). */
  minPartialLength: 4,
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

function parseHit(url: string): URL | null {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:"
      ? parsed
      : null;
  } catch {
    return null;
  }
}

function looksLikeDocs(parsed: URL): boolean {
  const first = parsed.hostname.replace(/^www\./, "").split(".")[0] ?? "";
  return DOCS_HOST_LABELS.has(first) || DOCS_PATH_HINT.test(parsed.pathname);
}

/**
 * Domains from the search hits, best first. Hits on denied sites are ignored unless the app's name is the
 * site's own name. A domain's score adds up its hits' search positions, a bonus for docs-looking pages,
 * and a bonus for how well its brand label matches the name.
 */
export function rankCandidates(name: string, hits: ResolveHit[]): Candidate[] {
  const key = nameKey(name);
  const titleOk = key.length >= SCORE_WEIGHTS.minPartialLength;
  const groups = new Map<string, Group>();

  hits.forEach((hit, index) => {
    const parsed = parseHit(hit.url);
    if (!parsed) {
      return;
    }
    const domain = registrableDomain(parsed.hostname);
    const label = domainLabel(parsed.hostname);
    const match = labelMatch(key, nameKey(label));
    if (DENY_DOMAINS.has(domain) && match !== "exact") {
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
    if (titleOk && nameKey(hit.title).includes(key)) {
      group.titleMatch = true;
    }
    groups.set(domain, group);
  });

  return [...groups.values()]
    .map((group): Candidate => {
      const match: Match =
        group.labelMatch !== "none"
          ? group.labelMatch
          : group.titleMatch
            ? "title"
            : "none";
      const bonus = match === "none" ? 0 : SCORE_WEIGHTS[match];
      return {
        domain: group.domain,
        label: group.label,
        match,
        score: group.position + group.docs + bonus,
        hits: group.hits,
      };
    })
    .sort((a, b) => b.score - a.score || a.domain.localeCompare(b.domain));
}
