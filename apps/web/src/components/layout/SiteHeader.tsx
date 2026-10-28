/**
 * File: SiteHeader.tsx
 * Purpose: Top bar with the wordmark, main navigation and theme toggle.
 * Exports: SiteHeader
 * Used by: PageShell
 */
import type { ReactElement } from 'react'
import { NavLink } from 'react-router'
import { cn } from '@/lib/utils'
import { Container } from './Container'
import { NAV_ITEMS } from './nav-items'
import { ThemeToggle } from './ThemeToggle'
import { Wordmark } from './Wordmark'

/** Three short items fit at 375px, so there is no menu button. */
export function SiteHeader(): ReactElement {
  return (
    <header className="border-b border-rule">
      <Container size="wide" className="flex h-16 items-center justify-between gap-3">
        <Wordmark />
        <nav aria-label="Main" className="flex items-center gap-1 tablet:gap-4">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                cn(
                  'rounded-md px-2 py-2 text-small',
                  isActive
                    ? 'text-ink underline decoration-ink decoration-2 underline-offset-8'
                    : 'text-ink-muted hover:text-ink',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
          <ThemeToggle />
        </nav>
      </Container>
    </header>
  )
}
