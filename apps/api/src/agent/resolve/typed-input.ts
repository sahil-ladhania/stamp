/**
 * File: typed-input.ts
 * Purpose: Reads what the user typed: a domain or URL (the official domain is known) or an app name (it needs a search).
 * Exports: parseTyped, cleanName, displayName, TypedInput, MAX_NAME_LENGTH
 * Used by: agent/nodes/resolve.ts
 */
import {
  domainLabel,
  hostFromTyped,
  registrableDomain,
} from "../../utils/registrable-domain.js";

export const MAX_NAME_LENGTH = 100;

export type TypedInput =
  | { kind: "domain"; domain: string; name: string }
  | { kind: "name"; name: string };

const VALID_HOST = /^(?:[a-z0-9-]+\.)+[a-z]{2,}$/;

/** One line of at most 100 characters: control characters and runs of whitespace become single spaces. */
export function cleanName(text: string): string {
  return text
    .replace(/[\p{Cc}\s]+/gu, " ")
    .trim()
    .slice(0, MAX_NAME_LENGTH)
    .trim();
}

/** "hubspot" -> "Hubspot"; a name typed with any capital letter is kept as typed. */
export function displayName(text: string): string {
  if (text !== text.toLowerCase()) {
    return text;
  }
  return text.replace(
    /(^|\s)(\p{L})/gu,
    (_match, space: string, letter: string) =>
      `${space}${letter.toUpperCase()}`,
  );
}

/** A typed URL or domain gives the official domain directly; anything else is an app name to look up. */
export function parseTyped(typed: string): TypedInput {
  const host = hostFromTyped(typed);
  if (host !== null && VALID_HOST.test(host)) {
    return {
      kind: "domain",
      domain: registrableDomain(host),
      name: displayName(domainLabel(host)),
    };
  }
  return { kind: "name", name: displayName(cleanName(typed)) };
}
