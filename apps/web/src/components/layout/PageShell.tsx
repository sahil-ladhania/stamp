/**
 * File: PageShell.tsx
 * Purpose: Root layout route: skip link, header, main landmark for the page, footer, scroll reset.
 * Exports: PageShell
 * Used by: router.tsx
 */
import type { ReactElement } from 'react'
import { Outlet, ScrollRestoration } from 'react-router'
import { SiteFooter } from './SiteFooter'
import { SiteHeader } from './SiteHeader'

/** Every route renders inside this shell through the Outlet. */
export function PageShell(): ReactElement {
  return (
    <div className="flex min-h-svh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:border focus:border-ink focus:bg-card focus:px-4 focus:py-2 focus:text-small focus:text-ink"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        <Outlet />
      </main>
      <SiteFooter />
      <ScrollRestoration />
    </div>
  )
}
