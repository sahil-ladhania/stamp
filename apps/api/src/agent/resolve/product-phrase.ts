/**
 * File: product-phrase.ts
 * Purpose: Finds the product an app's official page titles agree on ("Gmail API", "Microsoft Graph"): the longest name-plus-words phrase found in at least two titles. Null when they agree on nothing.
 * Exports: productPhrase, MAX_PHRASE_WORDS
 * Used by: agent/nodes/resolve.ts
 */
import { nameKey } from "../../utils/name-key.js";
import { sourceTier } from "../evidence/source-tier.js";
import type { ResolveHit } from "./candidates.js";

export const MAX_PHRASE_WORDS = 4;
const MIN_TITLES = 2;
const MAX_NAME_WORDS = 3;

/** Words that name a site, a section or a kind of page rather than a product, so a phrase never ends on one. */
const GENERIC_WORDS: ReadonlySet<string> = new Set([
  "docs",
  "doc",
  "documentation",
  "developer",
  "developers",
  "dev",
  "devs",
  "help",
  "center",
  "centre",
  "home",
  "overview",
  "reference",
  "guide",
  "guides",
  "learn",
  "support",
  "terms",
  "service",
  "tools",
  "tool",
  "integration",
  "integrations",
  "platform",
  "portal",
  "hub",
  "blog",
  "community",
]);

/** Words that start a new part of a sentence, so a phrase stops before them. */
const STOP_WORDS: ReadonlySet<string> = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "for",
  "to",
  "with",
  "in",
  "on",
  "of",
  "by",
  "at",
  "from",
  "your",
  "our",
  "how",
  "is",
  "are",
]);

/** Splits a title from its site name: "Overview | Acme Graph", "Reference - Acme". */
const TITLE_SPLIT = /\s[|–—·-]\s/;

/** A word of plain letters and digits, without a possessive or edge punctuation; null for anything else. */
function plainWord(token: string): string | null {
  const word = token
    .replace(/^[("'‘“]+|[),.:;!?"'’”]+$/g, "")
    .replace(/['’]s$/i, "");
  return /^[\p{L}\p{N}]+$/u.test(word) ? word : null;
}

type Occurrence = { words: string[]; next: number };

/** Every place the app's name appears in the tokens: the cleaned words of the name and where the next token is. */
function nameOccurrences(tokens: string[], key: string): Occurrence[] {
  const found: Occurrence[] = [];
  tokens.forEach((_, start) => {
    for (let length = 1; length <= MAX_NAME_WORDS; length += 1) {
      const span = tokens.slice(start, start + length);
      if (span.length < length) {
        break;
      }
      const words = span.map(plainWord);
      if (
        words.every((word) => word !== null) &&
        words.map((word) => nameKey(word ?? "")).join("") === key
      ) {
        found.push({ words: words as string[], next: start + length });
      }
    }
  });
  return found;
}

/** Name plus up to three plain words after it, cut at a stop word or odd mark and trimmed of trailing generic words. */
function phrasesAt(tokens: string[], found: Occurrence): string[] {
  const phrases: string[] = [];
  const words = [...found.words];
  for (
    let index = found.next;
    index < tokens.length && words.length < MAX_PHRASE_WORDS;
    index += 1
  ) {
    const word = plainWord(tokens[index] ?? "");
    if (word === null || STOP_WORDS.has(word.toLowerCase())) {
      break;
    }
    words.push(word);
    const kept = [...words];
    while (
      kept.length > found.words.length &&
      GENERIC_WORDS.has((kept[kept.length - 1] ?? "").toLowerCase())
    ) {
      kept.pop();
    }
    if (kept.length > found.words.length) {
      phrases.push(kept.join(" "));
    }
  }
  return phrases;
}

/**
 * The longest phrase that starts with the app's name and appears in the titles of at least two official,
 * non-forum hits. Only the part of a title before its site name is read, and only plain words count, so a
 * title cannot add marks or instructions to a search query. Ties go to the phrase in more titles, then the
 * one seen first. Null means "search by the app's name as before".
 */
export function productPhrase(
  name: string,
  hits: ResolveHit[],
  domains: readonly string[],
): string | null {
  const key = nameKey(name);
  if (key === "") {
    return null;
  }
  const seen = new Map<string, { text: string; titles: number }>();
  for (const hit of hits) {
    if (sourceTier(hit.url, domains) !== "official") {
      continue;
    }
    const first = hit.title.split(TITLE_SPLIT)[0] ?? "";
    const tokens = first.split(/\s+/).filter((token) => token !== "");
    const inThisTitle = new Set<string>();
    for (const found of nameOccurrences(tokens, key)) {
      for (const phrase of phrasesAt(tokens, found)) {
        const id = phrase.toLowerCase();
        if (!inThisTitle.has(id)) {
          inThisTitle.add(id);
          const entry = seen.get(id) ?? { text: phrase, titles: 0 };
          entry.titles += 1;
          seen.set(id, entry);
        }
      }
    }
  }
  const agreed = [...seen.values()]
    .filter((entry) => entry.titles >= MIN_TITLES)
    .sort(
      (a, b) =>
        b.text.split(" ").length - a.text.split(" ").length ||
        b.titles - a.titles,
    );
  return agreed[0]?.text ?? null;
}
