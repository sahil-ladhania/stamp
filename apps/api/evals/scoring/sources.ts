/**
 * File: sources.ts
 * Purpose: Sorts the URLs a guide cites into wrong-product, soft-product, off-path, third-party and fine, using the golden set's hints.
 * Exports: matchesHint, onDocsPath, scoreSources, SourceScore
 * Used by: evals/scoring/score-app.ts, evals/scoring/top-blocker.ts
 */
import type { Golden } from "../lib/golden.js";

export type SourceScore = {
  /** Pages of a sibling product the golden set says to avoid (counts toward the wrong-product metric). */
  wrongProduct: string[];
  /** Pages of a related product: flagged for a manual look, not counted. */
  softProduct: string[];
  /** Official-domain pages outside the golden path hints: the H2 signal. */
  offHint: string[];
  /** Pages on a domain the golden set does not list. */
  thirdParty: string[];
  ok: string[];
};

function parse(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

/** True when host plus path contains the hint, ignoring case. */
export function matchesHint(url: string, hint: string): boolean {
  const parsed = parse(url);
  if (!parsed) return false;
  const target = `${parsed.hostname}${parsed.pathname}`.toLowerCase();
  return target.includes(hint.toLowerCase());
}

function onDomain(parsed: URL, domains: readonly string[]): boolean {
  const host = parsed.hostname.toLowerCase();
  return domains.some(
    (domain) => host === domain || host.endsWith(`.${domain}`),
  );
}

function onPath(parsed: URL, hints: readonly string[]): boolean {
  if (hints.length === 0) return true;
  const path = parsed.pathname.toLowerCase();
  return hints.some((hint) => path.includes(hint.toLowerCase()));
}

/** True for a page on one of the golden domains, under one of its path hints. */
export function onDocsPath(url: string, docs: Golden["docs"]): boolean {
  const parsed = parse(url);
  return (
    parsed !== null &&
    onDomain(parsed, docs.domains) &&
    onPath(parsed, docs.pathHints)
  );
}

/** Each distinct URL lands in exactly one group, checked in the order: wrong product, soft product, third party, off path, fine. */
export function scoreSources(
  urls: readonly string[],
  golden: Golden,
): SourceScore {
  const result: SourceScore = {
    wrongProduct: [],
    softProduct: [],
    offHint: [],
    thirdParty: [],
    ok: [],
  };
  const hits = (url: string, severity: "hard" | "soft"): boolean =>
    golden.avoidProducts.some(
      (product) =>
        product.severity === severity &&
        product.hostPathHints.some((hint) => matchesHint(url, hint)),
    );
  for (const url of new Set(urls)) {
    const parsed = parse(url);
    if (hits(url, "hard")) result.wrongProduct.push(url);
    else if (hits(url, "soft")) result.softProduct.push(url);
    else if (!parsed || !onDomain(parsed, golden.docs.domains))
      result.thirdParty.push(url);
    else if (!onPath(parsed, golden.docs.pathHints)) result.offHint.push(url);
    else result.ok.push(url);
  }
  return result;
}
