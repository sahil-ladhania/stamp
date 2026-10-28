/**
 * File: not-found-hint.ts
 * Purpose: Pure helpers that read an unknown address and guess what the visitor meant.
 *          Name matching for routing only; there is no search here.
 * Exports: NotFoundHint, guessAppName, getNotFoundHint, getSearchPrefill
 * Used by: pages/NotFoundPage.tsx, components/not-found/NotFoundPanel.tsx, Guide page (step 6)
 */
import { LIBRARY_SUMMARIES, findLibrarySlug } from "@/mocks/guides";
import type { GuideSummary } from "@/mocks/types";

export type NotFoundHint =
  | { kind: "default" }
  | { kind: "suggestion"; guide: GuideSummary }
  | { kind: "unknown-guide"; appName: string };

const SEPARATORS = /[-_.\s]+/;
const MAX_NAME_LENGTH = 40;

/** A malformed escape such as `%E0%A4%A` stays as typed instead of throwing. */
function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function getSegments(pathname: string): string[] {
  return pathname.split("/").filter(Boolean).map(decodeSegment);
}

/** Turns `/hubspot-setup.html` into `hubspot setup`, or "" when the last segment is not a plain name. */
export function guessAppName(pathname: string): string {
  const last = getSegments(pathname).at(-1) ?? "";
  const name = last
    .replace(/\.[a-z0-9]{1,5}$/i, "")
    .split(SEPARATORS)
    .filter(Boolean)
    .join(" ");
  return /^[\p{L}\p{N} ]{2,}$/u.test(name)
    ? name.slice(0, MAX_NAME_LENGTH)
    : "";
}

/** The first library app named by any word in the path, for example `/hubspot-setup` finds HubSpot. */
function findSuggestion(pathname: string): GuideSummary | undefined {
  const words = getSegments(pathname).flatMap((segment) =>
    segment.split(SEPARATORS),
  );
  for (const word of words) {
    const slug = findLibrarySlug(word);
    const guide = LIBRARY_SUMMARIES.find((item) => item.slug === slug);
    if (guide) return guide;
  }
  return undefined;
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** A library app in the path wins. Otherwise a `/g/<name>` path means "no guide yet". */
export function getNotFoundHint(pathname: string): NotFoundHint {
  const guide = findSuggestion(pathname);
  if (guide) return { kind: "suggestion", guide };

  const isGuidePath = /^\/g\/[^/]+\/?$/.test(pathname);
  const name = guessAppName(pathname);
  if (isGuidePath && name) {
    return { kind: "unknown-guide", appName: capitalise(name) };
  }
  return { kind: "default" };
}

/** What the search box starts with: the matched app, the guessed name, or nothing. */
export function getSearchPrefill(pathname: string, hint: NotFoundHint): string {
  if (hint.kind === "suggestion") return hint.guide.appName;
  if (hint.kind === "unknown-guide") return "";
  return guessAppName(pathname);
}
