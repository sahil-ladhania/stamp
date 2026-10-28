/**
 * File: split-passages.ts
 * Purpose: Splits page text into passages: blank-line separated blocks as spans of the original text, long blocks cut at sentence ends.
 * Exports: splitPassages, MAX_PASSAGE_CHARS, Span
 * Used by: agent/extract/passages.ts
 */

/** A block longer than this is cut, so one long page section cannot use the whole budget. */
export const MAX_PASSAGE_CHARS = 1_200;

/** Where a passage sits in its page: `text.slice(start, end)` is the passage, exactly as written. */
export type Span = { start: number; end: number };

const BLANK_LINE = /(?:\r?\n[ \t]*){2,}/g;

function trimSpan(text: string, start: number, end: number): Span | null {
  let from = start;
  let to = end;
  while (from < to && /\s/.test(text[from] ?? "")) from += 1;
  while (to > from && /\s/.test(text[to - 1] ?? "")) to -= 1;
  return to > from ? { start: from, end: to } : null;
}

/** The best place to cut a long block: a line end, then a sentence end, then a space, else the limit. */
function cutPoint(text: string, start: number): number {
  const min = start + MAX_PASSAGE_CHARS / 2;
  const limit = start + MAX_PASSAGE_CHARS;
  const window = text.slice(min, limit);
  const line = window.lastIndexOf("\n");
  if (line >= 0) return min + line;
  const sentence = Math.max(
    window.lastIndexOf(". "),
    window.lastIndexOf("? "),
    window.lastIndexOf("! "),
  );
  if (sentence >= 0) return min + sentence + 1;
  const space = window.lastIndexOf(" ");
  return space >= 0 ? min + space : limit;
}

/**
 * Blank-line separated blocks as spans of the text (edges trimmed, nothing else changed). A block over
 * 1,200 characters is cut into pieces at line ends, then sentence ends. Every span is a contiguous slice.
 */
export function splitPassages(text: string): Span[] {
  const spans: Span[] = [];
  const add = (start: number, end: number): void => {
    let block = trimSpan(text, start, end);
    while (block && block.end - block.start > MAX_PASSAGE_CHARS) {
      const cut = cutPoint(text, block.start);
      const head = trimSpan(text, block.start, cut);
      if (head) spans.push(head);
      block = trimSpan(text, cut, block.end);
    }
    if (block) spans.push(block);
  };
  let from = 0;
  for (const separator of text.matchAll(BLANK_LINE)) {
    add(from, separator.index);
    from = separator.index + separator[0].length;
  }
  add(from, text.length);
  return spans;
}
