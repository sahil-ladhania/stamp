/**
 * File: library-app-slug.ts
 * Purpose: Slug guard for the apps that have a monochrome mark in the UI. LinkedIn and Salesforce are no longer library apps, so they have none.
 * Exports: LibraryAppSlug, isLibraryAppSlug
 * Used by: components/shared/AppIcon.tsx
 */

export type LibraryAppSlug = "github" | "hubspot" | "gmail";

const SLUGS: readonly LibraryAppSlug[] = ["github", "hubspot", "gmail"];

/** True when the slug is one of the apps that has a mark. */
export function isLibraryAppSlug(slug: string): slug is LibraryAppSlug {
  return (SLUGS as readonly string[]).includes(slug);
}
