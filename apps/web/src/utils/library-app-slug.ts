/**
 * File: library-app-slug.ts
 * Purpose: Slug guard for the five library apps that have monochrome marks in the UI.
 * Exports: LibraryAppSlug, isLibraryAppSlug
 * Used by: components/shared/AppIcon.tsx
 */

export type LibraryAppSlug =
  | "github"
  | "hubspot"
  | "gmail"
  | "linkedin"
  | "salesforce";

const SLUGS: readonly LibraryAppSlug[] = [
  "github",
  "hubspot",
  "gmail",
  "linkedin",
  "salesforce",
];

/** True when the slug is one of the five library guides. */
export function isLibraryAppSlug(slug: string): slug is LibraryAppSlug {
  return (SLUGS as readonly string[]).includes(slug);
}
