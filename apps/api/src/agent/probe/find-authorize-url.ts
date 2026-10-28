/**
 * File: find-authorize-url.ts
 * Purpose: Finds the OAuth authorize URL quoted by a Sourced claim from an official page, and the claims that quote it.
 * Exports: findAuthorizeProbe, urlsIn, isAuthorizeUrl, AuthorizeProbe
 * Used by: agent/nodes/probe.ts
 */
import type { Claim } from "@stamp/schema";
import { checkTarget } from "./target.js";

export type AuthorizeProbe = { url: string; claimIds: string[] };

const URL_PATTERN = /https:\/\/[^\s"'<>`\\^{}|]+/gi;
const TRAILING = /[.,;:!?)\]]+$/;

/** Paths that are an authorize endpoint: /authorize, /oauth/authorize, /oauth2/v2/authorize, /oauth/auth, /o/oauth2/v2/auth. */
const AUTHORIZE_PATHS = [
  /\/(?:authorize|authorization)\/?$/i,
  /\/oauth2?\/(?:v\d+(?:\.\d+)?\/)?auth\/?$/i,
  /\/o\/oauth2\/(?:v2\/)?auth\/?$/i,
];

/** Every https URL in the text, without the punctuation that ends a sentence. */
export function urlsIn(text: string): string[] {
  return (text.match(URL_PATTERN) ?? []).map((u) => u.replace(TRAILING, ""));
}

export function isAuthorizeUrl(raw: string): boolean {
  try {
    const { pathname } = new URL(raw);
    return AUTHORIZE_PATHS.some((pattern) => pattern.test(pathname));
  } catch {
    return false;
  }
}

/** The authorize URLs a claim quotes from an official page; only a Sourced claim counts. */
function quotedUrls(claim: Claim): string[] {
  if (claim.label !== "sourced") return [];
  return claim.sources
    .filter((source) => source.tier === "official")
    .flatMap((source) => urlsIn(source.quote))
    .filter(isAuthorizeUrl);
}

/**
 * The first authorize URL (in claim order) that passes the target guard, with every Sourced claim that
 * quotes it: those are the claims a passing probe may upgrade. Null when no such claim exists.
 */
export function findAuthorizeProbe(
  claims: readonly Claim[],
  officialDomain: string,
): AuthorizeProbe | null {
  for (const claim of claims) {
    const url = quotedUrls(claim).find(
      (candidate) => checkTarget(candidate, officialDomain).ok,
    );
    if (url !== undefined) {
      return {
        url,
        claimIds: claims
          .filter((other) => quotedUrls(other).includes(url))
          .map((other) => other.id),
      };
    }
  }
  return null;
}
