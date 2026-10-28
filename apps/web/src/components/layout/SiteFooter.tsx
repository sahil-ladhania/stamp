/**
 * File: SiteFooter.tsx
 * Purpose: Page footer with the tagline, links and the evidence reminder.
 * Exports: SiteFooter
 * Used by: PageShell
 */
import type { ReactElement } from 'react'
import { Link } from 'react-router'
import { Container } from './Container'
import { NAV_ITEMS } from './nav-items'
import { Wordmark } from './Wordmark'

/** Quiet footer: no sign-in, no pricing, nothing that is not in the product. */
export function SiteFooter(): ReactElement {
  return (
    <footer className="mt-16 border-t border-rule">
      <Container
        size="wide"
        className="flex flex-col gap-8 py-12 tablet:flex-row tablet:items-start tablet:justify-between"
      >
        <div className="flex max-w-sm flex-col items-start gap-3">
          <Wordmark />
          <p className="text-body text-ink-muted">Know what it takes to get your OAuth app stamped.</p>
        </div>
        <div className="flex flex-col gap-4 tablet:items-end">
          <nav aria-label="Footer" className="flex gap-6">
            {NAV_ITEMS.map((item) => (
              <Link key={item.to} to={item.to} className="text-small text-ink-muted hover:text-ink">
                {item.label}
              </Link>
            ))}
          </nav>
          <p className="max-w-xs text-small text-ink-muted tablet:text-right">
            Every claim is labelled Tested, Sourced or Uncertain. Check the source before you rely on one.
          </p>
        </div>
      </Container>
    </footer>
  )
}
