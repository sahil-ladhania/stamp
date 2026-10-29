/**
 * File: claim-quality.ts
 * Purpose: Sorts the Sourced and Tested claims of a guide by the page they stand on: good, wrong product, related product or third party.
 * Exports: scoreClaimQuality, ClaimQuality
 * Used by: evals/scoring/score-app.ts
 */
import type { EvidenceLabel, SourceTier } from "@stamp/schema";
import type { Golden } from "../lib/golden.js";
import { scoreSources } from "./sources.js";

export type ClaimQuality = {
  /** Sourced and Tested claims. */
  sourced: number;
  good: number;
  wrongProduct: number;
  related: number;
  thirdParty: number;
  /** good / sourced, or 0 when nothing is Sourced. */
  share: number;
};

type QualityClaim = {
  label: EvidenceLabel;
  sources: readonly { url: string; tier: SourceTier }[];
};

/**
 * Each firm claim is put in one group by its worst source: a page the golden set says to avoid, then a
 * related product's page, then any page that is not official. A tier of official alone proves nothing.
 */
export function scoreClaimQuality(
  claims: readonly QualityClaim[],
  golden: Golden,
): ClaimQuality {
  const result: ClaimQuality = {
    sourced: 0,
    good: 0,
    wrongProduct: 0,
    related: 0,
    thirdParty: 0,
    share: 0,
  };
  for (const claim of claims) {
    if (claim.label === "uncertain") continue;
    result.sourced += 1;
    const found = scoreSources(
      claim.sources.map((source) => source.url),
      golden,
    );
    if (found.wrongProduct.length > 0) result.wrongProduct += 1;
    else if (found.softProduct.length > 0) result.related += 1;
    else if (claim.sources.some((source) => source.tier !== "official")) {
      result.thirdParty += 1;
    } else result.good += 1;
  }
  result.share = result.sourced === 0 ? 0 : result.good / result.sourced;
  return result;
}
