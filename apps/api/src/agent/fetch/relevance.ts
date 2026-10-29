/**
 * File: relevance.ts
 * Purpose: Scores how well a search result answers the question its topic asks, from its title, URL and search score alone. Round weights, no vendor names.
 * Exports: relevance, topicFit, RelevanceContext
 * Used by: agent/fetch/select-pages.ts
 */
import { DOCS_HOST_LABELS, DOCS_PATH_HINT } from "../resolve/denylist.js";
import type { SearchResult } from "../search-result.js";

export type RelevanceContext = { product: string | null };

/** Words that mean a title or path answers each planned topic. Generic web terms, not vendor wording. */
const TOPIC_WORDS: Record<string, RegExp> = {
  setup:
    /oauth|authoriz|credential|client id|register|getting started|quickstart|create an? (?:app|integration|connection)/i,
  scopes: /scope|permission/i,
  review: /review|verif|approv|listing|marketplace|assessment|compliance/i,
  limits: /limit|quota|throttl/i,
  authType: /authent|oauth|api key|token/i,
  approvalWait: /review|verif|approv|timeline|how long|turnaround/i,
};
const OAUTH_TITLE =
  /oauth|authoriz|authenticat|scopes?\b|permission|app review|verification|credential/i;
/** Community, blog and help pages are a second voice, not the documentation: a soft penalty, never an exclusion. */
const NOISY_PATH =
  /\/(?:blogs?|community|communities|forums?|discussions?|issues?|questions?|answers?|templates?|changelog|release-notes|news|help)(?:[/?#]|$)/i;
const LEGACY = /legacy|deprecated|archived|sunset|retired/i;

const TITLE_FIT = 2;
const PATH_FIT = 1;
const OAUTH_BONUS = 1;
const DOCS_BONUS = 1;
const PRODUCT_BONUS = 1;
const NOISY_PENALTY = 1.5;
const LEGACY_PENALTY = 2;

function parts(url: string): { host: string; path: string } {
  try {
    const parsed = new URL(url);
    return { host: parsed.hostname, path: decodeURIComponent(parsed.pathname) };
  } catch {
    return { host: "", path: "" };
  }
}

/** The best fit among the topics whose queries found this result: 2 for a title that answers it, 1 more for a path that does. */
export function topicFit(result: SearchResult): number {
  const { path } = parts(result.url);
  return Math.max(
    0,
    ...(result.topics ?? []).map((topic) => {
      const words = TOPIC_WORDS[topic];
      return words === undefined
        ? 0
        : (words.test(result.title ?? "") ? TITLE_FIT : 0) +
            (words.test(path) ? PATH_FIT : 0);
    }),
  );
}

/**
 * Higher is more likely to hold the answer. The search's own score (0 to 1) only separates results the
 * other features rate alike, so a title that answers the question beats a better-scored page that does not.
 */
export function relevance(
  result: SearchResult,
  context: RelevanceContext,
): number {
  const { host, path } = parts(result.url);
  const title = result.title ?? "";
  const isDocs =
    DOCS_HOST_LABELS.has(host.replace(/^www\./, "").split(".")[0] ?? "") ||
    DOCS_PATH_HINT.test(path);
  const hasProduct =
    context.product !== null &&
    title.toLowerCase().includes(context.product.toLowerCase());
  return (
    topicFit(result) +
    (OAUTH_TITLE.test(title) ? OAUTH_BONUS : 0) +
    (isDocs ? DOCS_BONUS : 0) +
    (hasProduct ? PRODUCT_BONUS : 0) -
    (NOISY_PATH.test(path) ? NOISY_PENALTY : 0) -
    (LEGACY.test(title) || LEGACY.test(path) ? LEGACY_PENALTY : 0) +
    (result.score ?? 0)
  );
}
