/**
 * File: hit-evidence.ts
 * Purpose: What one search hit says: its parsed address, whether it looks like documentation, and whether it names the app (in its title, its address or the start of its snippet).
 * Exports: parseHit, looksLikeDocs, mentionsName, minKeyLength, ResolveHit, SNIPPET_WINDOW, MIN_LATIN_NAME_LENGTH
 * Used by: agent/resolve/candidates.ts, agent/resolve/resolve-from-hits.ts
 */
import { textKey } from "../../utils/name-key.js";
import { DOCS_HOST_LABELS, DOCS_PATH_HINT } from "./denylist.js";

export type ResolveHit = {
  url: string;
  title: string;
  /** The start of the page text the search returned, when it returned any. */
  snippet?: string;
};

/** How much of a snippet is read for the app's name: the start, where a page says what it is about. */
export const SNIPPET_WINDOW = 200;

/** Shortest Latin name or label that may partly match another ("art" must not match "smart"). */
export const MIN_LATIN_NAME_LENGTH = 4;

export function parseHit(url: string): URL | null {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:"
      ? parsed
      : null;
  } catch {
    return null;
  }
}

/** True for a documentation page: a docs-looking host label (docs., developers.) or path (/docs/, /api/). */
export function looksLikeDocs(parsed: URL): boolean {
  const first = parsed.hostname.replace(/^www\./, "").split(".")[0] ?? "";
  return DOCS_HOST_LABELS.has(first) || DOCS_PATH_HINT.test(parsed.pathname);
}

/** The shortest name key that may match a page: four characters of Latin text, two of a script like Chinese, where two is a word. */
export function minKeyLength(key: string): number {
  return /[^\p{ASCII}]/u.test(key) ? 2 : MIN_LATIN_NAME_LENGTH;
}

function decodedPath(parsed: URL): string {
  try {
    return decodeURIComponent(parsed.pathname);
  } catch {
    return parsed.pathname;
  }
}

/** A hit names the app when its title, its address or the start of its text holds the name. */
export function mentionsName(
  parsed: URL,
  hit: ResolveHit,
  key: string,
): boolean {
  const texts = [
    hit.title,
    decodedPath(parsed),
    (hit.snippet ?? "").slice(0, SNIPPET_WINDOW),
  ];
  return texts.some((text) => textKey(text).includes(key));
}
