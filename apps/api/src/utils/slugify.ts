/**
 * File: slugify.ts
 * Purpose: Turns what a user typed (app name or URL) into the lowercase slug used for guides and run locks.
 * Exports: slugify
 * Used by: services/runs.ts
 */
import { domainLabel, hostFromTyped } from "./registrable-domain.js";

const MAX_SLUG_LENGTH = 100;

/** The app name inside a typed URL or domain ("developers.hubspot.com" -> "hubspot"); null for a plain name. */
function appLabelFromUrl(value: string): string | null {
  const host = hostFromTyped(value);
  return host === null ? null : domainLabel(host);
}

/** Lowercase, hyphen-separated slug; empty when the input has no letters or digits. */
export function slugify(input: string): string {
  const value = input.trim().toLowerCase();
  const base = appLabelFromUrl(value) ?? value;
  return base
    .normalize("NFKD")
    .replace(/[\u0300-\u036F]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/^-+|-+$/g, "");
}
