/**
 * File: identity.ts
 * Purpose: Derives what the resolve stage knows about the official app beyond one domain: every official domain and the product phrase, both read from the same search hits.
 * Exports: deriveIdentity, Derived
 * Used by: agent/nodes/resolve.ts
 */
import type { Candidate, ResolveHit } from "./candidates.js";
import { officialDomains } from "./official-domains.js";
import { productPhrase } from "./product-phrase.js";

export type Derived = { domains: string[]; product: string | null };

/** The official domains first, then the product phrase, which counts only pages on those domains. */
export function deriveIdentity(
  name: string,
  hits: ResolveHit[],
  candidates: Candidate[],
  primary: string,
): Derived {
  const domains = officialDomains(candidates, primary);
  return { domains, product: productPhrase(name, hits, domains) };
}
