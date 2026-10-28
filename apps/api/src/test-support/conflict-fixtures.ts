/**
 * File: conflict-fixtures.ts
 * Purpose: Pages, claims and a proposal builder for the conflict tests: an official review page, a blog and a forum post that disagree about review time.
 * Exports: BLOG_URL, blog, forum, index, official, viaBlog, proposal, proposed
 * Used by: agent/verify/verify-conflicts*.test.ts
 */
import { PAGES, QUOTES, REVIEW_URL, claim } from "./extract-fixtures.js";
import { drafted } from "./guide-fixtures.js";
import { pageRecord } from "./node-fixtures.js";
import { indexPages } from "../agent/extract/sanitize.js";
import type { Drafts } from "../agent/state.js";

export const BLOG_URL = "https://blog.example.net/review";
const BLOG_TEXT =
  "In our experience app approval takes about two weeks, not days.";
export const blog = pageRecord(BLOG_URL, "third_party", BLOG_TEXT);
export const forum = pageRecord(
  "https://community.acme.com/t/9",
  "forum",
  "People report approval taking around three weeks.",
);
export const index = indexPages([...PAGES, blog, forum]);
export const official = claim(
  REVIEW_URL,
  QUOTES.review,
  "Review takes 5 to 7 business days.",
);
export const viaBlog = claim(
  BLOG_URL,
  "app approval takes about two weeks, not days.",
  "Approval takes about two weeks.",
);
export const proposal = (over = {}) => ({
  topic: "Review time",
  sourceA: official,
  sourceB: viaBlog,
  preferredUrl: REVIEW_URL,
  reason: official,
  ...over,
});
export const proposed = (...items: ReturnType<typeof proposal>[]): Drafts => ({
  conflicts: drafted<"conflicts">({ conflicts: items }),
});
