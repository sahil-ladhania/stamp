/**
 * File: hash-url.ts
 * Purpose: Builds a stable SHA-256 key for a URL (used as page_cache primary key) and the normal form it hashes.
 * Exports: normalizeUrl, hashUrl
 * Used by: services/page-cache.ts, agent/nodes/fetch.ts, agent/nodes/search.ts
 */
import { sha256Hex } from "./sha256.js";

// Tracking parameters never change which page is served.
const TRACKING_PARAM = /^(utm_.*|fbclid|gclid|msclkid|mc_cid|mc_eid)$/i;

/**
 * Canonical form of an http(s) URL: lowercase host, no fragment, no credentials,
 * no default port, no tracking parameters, query parameters sorted.
 * Throws TypeError for anything that is not a valid http or https URL.
 */
export function normalizeUrl(input: string): string {
  const url = new URL(input.trim());
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new TypeError(
      `Only http and https URLs are supported: ${url.protocol}`,
    );
  }
  url.hash = "";
  url.username = "";
  url.password = "";
  url.hostname = url.hostname.replace(/\.$/, "");
  for (const key of [...url.searchParams.keys()]) {
    if (TRACKING_PARAM.test(key)) {
      url.searchParams.delete(key);
    }
  }
  url.searchParams.sort();
  return url.toString();
}

/** SHA-256 of the normalised URL: equal pages hash equal; long URLs fit a MySQL key. */
export function hashUrl(url: string): string {
  return sha256Hex(normalizeUrl(url));
}
