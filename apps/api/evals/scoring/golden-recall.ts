/**
 * File: golden-recall.ts
 * Purpose: Counts how many of the golden pages the search found and the run read, which measures the identity and selection stages directly.
 * Exports: scoreGoldenRecall, goldenPageUrls, pageKey, GoldenRecall
 * Used by: evals/scoring/score-app.ts
 */
import type { Golden } from "../lib/golden.js";

export type GoldenRecall = {
  /** Distinct pages the golden file cites. */
  total: number;
  /** Of those, found in the search results (or read, which implies found). */
  inResults: number;
  fetched: number;
};

/** A page without its scheme, www, query, fragment, trailing slash or case, so variants of one URL compare equal. */
export function pageKey(url: string): string {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/\/+$/, "");
    return `${parsed.hostname.replace(/^www\./, "")}${path}`.toLowerCase();
  } catch {
    return url;
  }
}

/** Every page the golden file cites as a source, once each. */
export function goldenPageUrls(golden: Golden): string[] {
  const sources = [
    golden.product.source,
    golden.oauthAppCreation.source,
    golden.reviewGate.source,
    ...(golden.reviewGate.moreSources ?? []),
    ...(golden.approvalWait.source ? [golden.approvalWait.source] : []),
    ...(golden.approvalWait.moreSources ?? []),
    golden.testBeforeApproval.source,
    ...golden.scopes.real.map((scope) => scope.source),
    ...(golden.scopes.offSurface ? [golden.scopes.offSurface.source] : []),
    ...golden.blockers.map((blocker) => blocker.source),
  ];
  return [...new Map(sources.map((s) => [pageKey(s.url), s.url])).values()];
}

/** Compares by page key; an alias maps a URL the agent sees to the golden page it redirects to. */
export function scoreGoldenRecall(
  resultUrls: readonly string[],
  heldUrls: readonly string[],
  golden: Golden,
): GoldenRecall {
  const aliases = new Map(
    (golden.docs.urlAliases ?? []).map((alias) => [
      pageKey(alias.seenAs),
      pageKey(alias.golden),
    ]),
  );
  const keysOf = (urls: readonly string[]): Set<string> =>
    new Set(
      urls.map((url) => {
        const key = pageKey(url);
        return aliases.get(key) ?? key;
      }),
    );
  const wanted = goldenPageUrls(golden).map(pageKey);
  const held = keysOf(heldUrls);
  const found = new Set([...keysOf(resultUrls), ...held]);
  return {
    total: wanted.length,
    inResults: wanted.filter((key) => found.has(key)).length,
    fetched: wanted.filter((key) => held.has(key)).length,
  };
}
