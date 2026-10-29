/**
 * File: official-domains.ts
 * Purpose: Lists every official domain of the company the resolve search found: the winner, plus other domains that carry the same brand name and have documentation hits (slack.com and slack.dev).
 * Exports: officialDomains, MAX_OFFICIAL_DOMAINS
 * Used by: agent/nodes/resolve.ts
 */
import type { Candidate } from "./candidates.js";
import { SHARED_HOSTING_DOMAINS } from "./denylist.js";

/** A company rarely has more than a few documentation domains; the cap keeps a noisy search from widening trust. */
export const MAX_OFFICIAL_DOMAINS = 3;

/**
 * The primary domain first, then other candidates with the same brand label that had a documentation-looking hit,
 * best scored first. Domains are added only when the winner matched the name by its own label: a winner found
 * by a page title (Gmail on google.com) says nothing about its siblings. Shared hosting domains never count,
 * because their labels belong to whoever rents a subdomain. This list widens which pages count as official;
 * the probe and the guide's domain stay on the primary domain alone.
 */
export function officialDomains(
  candidates: Candidate[],
  primary: string,
): string[] {
  const winner = candidates.find((candidate) => candidate.domain === primary);
  if (!winner || (winner.match !== "exact" && winner.match !== "partial")) {
    return [primary];
  }
  const siblings = candidates
    .filter(
      (candidate) =>
        candidate.domain !== primary &&
        candidate.label === winner.label &&
        candidate.docs &&
        !SHARED_HOSTING_DOMAINS.has(candidate.domain),
    )
    .map((candidate) => candidate.domain);
  return [primary, ...siblings].slice(0, MAX_OFFICIAL_DOMAINS);
}
