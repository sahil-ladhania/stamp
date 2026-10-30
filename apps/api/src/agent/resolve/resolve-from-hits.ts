/**
 * File: resolve-from-hits.ts
 * Purpose: The decision part of Resolve, from a name and its search hits: the ranked candidates, the decision and, when it is official, the identity. When nothing matches the name but every hit is a documentation page on one site, it asks about that site. No search, no events, so the resolve node and the resolve stress test make the same decision.
 * Exports: resolveFromHits, agreedDocsSite, ResolveFromHits
 * Used by: agent/nodes/resolve.ts, agent/resolve/resolve-search.ts, evals/resolve/resolve-one.ts
 */
import {
  domainLabel,
  registrableDomain,
} from "../../utils/registrable-domain.js";
import {
  looksLikeDocs,
  parseHit,
  rankCandidates,
  type Candidate,
  type ResolveHit,
} from "./candidates.js";
import { decideOfficial, type Decision } from "./decide.js";
import { SHARED_HOSTING_DOMAINS } from "./denylist.js";
import { deriveIdentity, type Derived } from "./identity.js";
import { displayName } from "./typed-input.js";

export type ResolveFromHits = {
  candidates: Candidate[];
  decision: Decision;
  /** Set only when the decision is official. */
  identity: Derived | null;
};

/**
 * The one site every hit agrees on, when there are two or more hits, every one is a documentation page on the same
 * registrable domain (denied sites included: a rebrand's docs can sit on one), and it is not a shared host. A rebrand
 * is the usual case: "Twitter" finds only docs.x.com and developer.x.com. Null for anything less than all hits agreeing.
 */
export function agreedDocsSite(
  hits: ResolveHit[],
): { name: string; domain: string } | null {
  const pages = hits.map((hit) => parseHit(hit.url));
  const first = pages[0];
  if (pages.length < 2 || !first) return null;
  const domain = registrableDomain(first.hostname);
  const agreed = pages.every(
    (page) =>
      page !== null &&
      looksLikeDocs(page) &&
      registrableDomain(page.hostname) === domain,
  );
  if (!agreed || SHARED_HOSTING_DOMAINS.has(domain)) return null;
  return { name: displayName(domainLabel(first.hostname)), domain };
}

/**
 * Nothing matched the name, so Resolve cannot say a site is the app's. It can ask about the one documentation site
 * all the hits agree on. The person decides; Resolve never picks it.
 */
function askAboutAgreedSite(decision: Decision, hits: ResolveHit[]): Decision {
  if (decision.kind !== "none") return decision;
  const site = agreedDocsSite(hits);
  return site ? { kind: "ambiguous", options: [site] } : decision;
}

export function resolveFromHits(
  name: string,
  hits: ResolveHit[],
): ResolveFromHits {
  const candidates = rankCandidates(name, hits);
  const decision = askAboutAgreedSite(decideOfficial(candidates), hits);
  const identity =
    decision.kind === "official"
      ? deriveIdentity(name, hits, candidates, decision.domain)
      : null;
  return { candidates, decision, identity };
}
