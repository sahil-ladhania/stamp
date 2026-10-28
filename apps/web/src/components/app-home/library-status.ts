/**
 * File: library-status.ts
 * Purpose: The four states of the library list: ready, loading, empty and error.
 * Exports: LibraryStatus
 * Used by: components/app-home/LibrarySection.tsx, LibraryList.tsx, pages/AppHomePage.tsx
 */

export type LibraryStatus = "ready" | "loading" | "empty" | "error";
