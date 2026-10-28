/**
 * File: PlaceholderPage.tsx
 * Purpose: Temporary page body for routes that are built in a later step. Lists the mock states.
 * Exports: PlaceholderPage
 * Used by: pages/* until each page ships
 */
import type { ReactElement } from 'react'
import { Link } from 'react-router'
import { Container } from '@/components/layout/Container'
import { SectionHeading } from '@/components/shared/SectionHeading'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useMockScenario } from '@/hooks/useMockScenario'
import { cn } from '@/lib/utils'

type PlaceholderPageProps = {
  title: string
  route: string
  /** The roadmap step that builds this page. */
  step: number
  scenarios?: readonly [string, ...string[]]
}

const DEFAULT_SCENARIOS = ['default'] as const

/** Shows the resolved `?state=` so the scenario switch can be checked before the page exists. */
export function PlaceholderPage({ title, route, step, scenarios = DEFAULT_SCENARIOS }: PlaceholderPageProps): ReactElement {
  useDocumentTitle(title)
  const { scenario } = useMockScenario(scenarios)

  return (
    <Container className="flex flex-col gap-6 py-12">
      <p className="text-data text-ink-muted">{route}</p>
      <SectionHeading level={1} title={title} description={`This page is a placeholder. It is built in step ${step}.`} />
      {scenarios.length > 1 && (
        <section aria-labelledby="mock-states" className="flex flex-col gap-3">
          <h2 id="mock-states" className="text-card-title text-ink">
            Mock states
          </h2>
          <ul className="flex flex-wrap gap-2">
            {scenarios.map((name) => (
              <li key={name}>
                <Link
                  to={`?state=${name}`}
                  aria-current={name === scenario ? 'true' : undefined}
                  className={cn(
                    'inline-block rounded-full border px-3 py-1 text-data transition-colors hover:border-ink-muted',
                    name === scenario ? 'border-ink bg-card text-ink' : 'border-rule text-ink-muted',
                  )}
                >
                  {name}
                </Link>
              </li>
            ))}
          </ul>
          <p className="text-small text-ink-muted">
            Current state: <span className="text-data text-ink">{scenario}</span>
          </p>
        </section>
      )}
    </Container>
  )
}
