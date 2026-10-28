/**
 * File: useMockSearch.ts
 * Purpose: Mock search submit: a library name opens its guide, anything else opens the demo live run.
 * Exports: useMockSearch
 * Used by: Landing, App home, Not found pages (replaced by the real start-run hook later)
 */
import { useNavigate } from 'react-router'
import { findLibrarySlug } from '@/mocks/guides'
import { MOCK_RUN_ID } from '@/mocks/run-events'

/** Routing only. There is no lookup, no network and no run. */
export function useMockSearch(): { submit: (app: string) => void } {
  const navigate = useNavigate()

  function submit(app: string): void {
    const slug = findLibrarySlug(app)
    navigate(slug ? `/g/${slug}` : `/run/${MOCK_RUN_ID}?app=${encodeURIComponent(app)}`)
  }

  return { submit }
}
