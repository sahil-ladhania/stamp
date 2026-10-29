/**
 * File: markdown-links.ts
 * Purpose: Rewrites markdown links in fetched page text so the address stays visible next to its label ("label (url)"), because providers often show a scope name only as a link.
 * Exports: rewriteLinks
 * Used by: lib/tavily.ts
 */

const IMAGE = /!\[[^\]\n]*\]\([^)\s]*(?:\s+"[^"]*")?\)/g;
const LINK = /\[([^\]\n]*)\]\(<?([^)\s>]*)>?(?:\s+"[^"]*")?\)/g;

/**
 * "[label](url)" becomes "label (url)"; when the label is the address itself, just the address; an empty
 * label leaves the address. Images are removed. Quotes are checked against the text as stored, so the
 * rewrite changes nothing about how a quote is verified, only what a quote can contain.
 */
export function rewriteLinks(text: string): string {
  return text
    .replace(IMAGE, "")
    .replace(LINK, (_whole, label: string, url: string) => {
      const trimmed = label.trim();
      return trimmed === "" || trimmed === url ? url : `${trimmed} (${url})`;
    });
}
