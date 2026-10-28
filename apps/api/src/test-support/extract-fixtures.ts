/**
 * File: extract-fixtures.ts
 * Purpose: Two small inline pages and claim builders for the extract tests: no files, no live calls.
 * Exports: OAUTH_URL, REVIEW_URL, OAUTH_TEXT, REVIEW_TEXT, PAGES, PAGE_INDEX, claim, QUOTES
 * Used by: agent/extract/*.test.ts, agent/nodes/extract*.test.ts
 */
import { indexPages } from "../agent/extract/sanitize.js";
import type { DraftClaim } from "../agent/draft-claim.js";
import { pageRecord } from "./node-fixtures.js";

export const OAUTH_URL = "https://docs.acme.com/oauth";
export const REVIEW_URL = "https://docs.acme.com/review";

export const OAUTH_TEXT = [
  "# Create an OAuth app",
  "To use the API on behalf of users, create an app in the developer portal.",
  "Open Settings, choose Developer apps, then select Create app. Copy the client ID and the client secret.",
  "Add a redirect URI. Only HTTPS redirect URIs are allowed in production.",
  "## Scopes",
  "The contacts.read scope lets an app read contacts. The contacts.write scope lets an app create and update contacts.",
  "## Limits",
  "Each app can be installed on up to 25 accounts until it is approved. API calls are limited to 100 requests per 10 seconds.",
].join("\n\n");

export const REVIEW_TEXT = [
  "# App review",
  "Apps that need more than 25 installs must be approved by the marketplace team. Review usually takes 5 to 7 business days.",
  "Enterprise accounts can skip the install cap by contacting support.",
].join("\n\n");

/** Exact sentences from the pages above, for claims that should verify. */
export const QUOTES = {
  secret: "Copy the client ID and the client secret.",
  scope: "The contacts.read scope lets an app read contacts.",
  cap: "Each app can be installed on up to 25 accounts until it is approved.",
  rate: "API calls are limited to 100 requests per 10 seconds.",
  review: "Review usually takes 5 to 7 business days.",
  approval:
    "Apps that need more than 25 installs must be approved by the marketplace team.",
} as const;

export const PAGES = [
  pageRecord(OAUTH_URL, "official", OAUTH_TEXT),
  pageRecord(REVIEW_URL, "official", REVIEW_TEXT),
];
export const PAGE_INDEX = indexPages(PAGES);

export function claim(
  url: string,
  quote: string,
  text = "A fact from the page.",
): DraftClaim {
  return { text, quote, url };
}
