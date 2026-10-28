/**
 * File: passages.ts
 * Purpose: Picks the parts of fetched pages that matter to one guide section, by keyword, as exact slices of the original text.
 * Exports: scoreText, compileKeywords, selectExcerpts, PageText, Excerpt, Selection
 * Used by: agent/extract/run-section.ts
 */
import type { SourceTier } from "@stamp/schema";
import { splitPassages, type Span } from "./split-passages.js";

export type PageText = { url: string; tier: SourceTier; text: string };
/** The passages chosen from one page, in page order; each is an exact slice of that page's text. */
export type Excerpt = { url: string; tier: SourceTier; passages: string[] };
export type Selection = { excerpts: Excerpt[]; chars: number };

/** Official pages count in full; other sources only when nothing official covers the topic as well. */
const TIER_WEIGHT: Record<SourceTier, number> = {
  official: 1,
  third_party: 0.5,
  forum: 0.4,
};
/** One page may use at most this share of the budget when there are several, so sources stay varied. */
const PER_PAGE_SHARE = 0.6;
const MAX_COUNTED_HITS = 3;
const HEADING_MAX_CHARS = 100;
const HEADING_MAX_WORDS = 8;
/** Passages are joined only across a gap this small (a line break or two), and each is budgeted for one. */
const MAX_JOIN_GAP = 4;

const escapeRegExp = (text: string): string =>
  text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** A keyword matches at the start of a word, so "scope" finds "scopes" but "app" does not find "mapping". */
export function compileKeywords(keywords: readonly string[]): RegExp[] {
  return keywords.map(
    (word) => new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(word)}`, "giu"),
  );
}

/** Two points for each different keyword present, plus one for each occurrence (at most 3 per keyword). */
export function scoreText(text: string, patterns: readonly RegExp[]): number {
  let score = 0;
  for (const pattern of patterns) {
    const hits = Math.min(MAX_COUNTED_HITS, [...text.matchAll(pattern)].length);
    if (hits > 0) score += 2 + hits;
  }
  return score;
}

/** A markdown heading, or a short unpunctuated line in Title Case. A plain short sentence is not a heading. */
function looksLikeHeading(passage: string): boolean {
  if (passage.length > HEADING_MAX_CHARS || passage.includes("\n")) {
    return false;
  }
  if (passage.startsWith("#")) {
    return true;
  }
  if (/[.!?:;,]$/.test(passage)) {
    return false;
  }
  const words = passage.split(/\s+/);
  const capitalised = words.filter((word) => /^\p{Lu}/u.test(word)).length;
  return words.length <= HEADING_MAX_WORDS && capitalised / words.length >= 0.6;
}

type Candidate = { page: number; span: Span; score: number };

/**
 * The passages most relevant to the keywords, up to `charBudget` characters in all. Official pages are
 * preferred, one page cannot take more than 60% of the budget, a heading is kept with the passage under
 * it, and passages that touch are joined. The result never exceeds `charBudget` characters. Every returned passage is a slice of the original page text.
 * A page with no keyword hit contributes nothing, so no hits at all means no excerpts.
 */
export function selectExcerpts(
  pages: readonly PageText[],
  keywords: readonly string[],
  charBudget: number,
): Selection {
  const patterns = compileKeywords(keywords);
  const candidates: Candidate[] = [];
  pages.forEach((page, index) => {
    const spans = splitPassages(page.text);
    const texts = spans.map((span) => page.text.slice(span.start, span.end));
    const scores = texts.map((text) => scoreText(text, patterns));
    spans.forEach((span, i) => {
      const next = scores[i + 1] ?? 0;
      const base =
        scores[i] === 0 && next > 0 && looksLikeHeading(texts[i] ?? "")
          ? next / 2
          : (scores[i] ?? 0);
      if (base > 0) {
        candidates.push({
          page: index,
          span,
          score: base * TIER_WEIGHT[page.tier],
        });
      }
    });
  });
  candidates.sort(
    (a, b) =>
      b.score - a.score || a.page - b.page || a.span.start - b.span.start,
  );

  const pageCap =
    pages.length > 1 ? Math.ceil(charBudget * PER_PAGE_SHARE) : charBudget;
  const used = new Array<number>(pages.length).fill(0);
  const chosen: Candidate[][] = pages.map(() => []);
  let total = 0;
  for (const candidate of candidates) {
    const length = candidate.span.end - candidate.span.start + MAX_JOIN_GAP;
    if (
      total + length > charBudget ||
      (used[candidate.page] ?? 0) + length > pageCap
    ) {
      continue;
    }
    used[candidate.page] = (used[candidate.page] ?? 0) + length;
    total += length;
    chosen[candidate.page]?.push(candidate);
  }

  const excerpts: Excerpt[] = [];
  let chars = 0;
  pages.forEach((page, index) => {
    const spans = (chosen[index] ?? [])
      .map((c) => c.span)
      .sort((a, b) => a.start - b.start);
    const merged: Span[] = [];
    for (const span of spans) {
      const last = merged.at(-1);
      const gap = last ? page.text.slice(last.end, span.start) : "";
      if (last && gap.trim() === "" && gap.length <= MAX_JOIN_GAP) {
        last.end = span.end;
      } else {
        merged.push({ ...span });
      }
    }
    if (merged.length > 0) {
      const passages = merged.map((span) =>
        page.text.slice(span.start, span.end),
      );
      chars += passages.reduce((sum, passage) => sum + passage.length, 0);
      excerpts.push({ url: page.url, tier: page.tier, passages });
    }
  });
  return { excerpts, chars };
}
