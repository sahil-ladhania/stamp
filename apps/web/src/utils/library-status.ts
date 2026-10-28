/**
 * File: library-status.ts
 * Purpose: The four states of the library list (ready, loading, empty, error) and how a load result maps to one.
 * Exports: LibraryStatus, getLibraryStatus
 * Used by: pages/AppHomePage.tsx, components/app-home/LibrarySection.tsx, components/app-home/LibraryList.tsx
 */
export type LibraryStatus = 'ready' | 'loading' | 'empty' | 'error'

type LoadResult = { isLoading: boolean; hasError: boolean; count: number }

/** An empty list is its own state, not an error: the library can be unseeded. */
export function getLibraryStatus({ isLoading, hasError, count }: LoadResult): LibraryStatus {
  if (isLoading) return 'loading'
  if (hasError) return 'error'
  return count === 0 ? 'empty' : 'ready'
}
