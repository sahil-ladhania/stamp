/**
 * File: App.tsx
 * Purpose: Temporary design-token preview until real routes ship.
 * Exports: default App
 * Used by: main.tsx
 */
import { useCallback, useState } from 'react'

type SwatchProps = {
  label: string
  className: string
  textClassName?: string
}

function Swatch({ label, className, textClassName = 'text-ink' }: SwatchProps) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className={`h-12 rounded-md border border-rule ${className} ${textClassName} flex items-center justify-center text-small`}
      >
        {label}
      </div>
      <span className="text-small text-ink-muted">{label}</span>
    </div>
  )
}

function App() {
  const [isDark, setIsDark] = useState(false)

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev
      document.documentElement.classList.toggle('dark', next)
      return next
    })
  }, [])

  return (
    <div className="mx-auto flex w-full max-w-content flex-col gap-8 p-card">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-page-title text-ink">Stamp design tokens</h1>
          <p className="text-body text-ink-muted">
            Temporary preview for colours, type and layout tokens
          </p>
          <code className="text-data text-sourced">crm.objects.contacts.read</code>
          <p className="text-stamp-label text-stamp">First test: about 1 hour</p>
        </div>
        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-md bg-stamp px-4 py-2 text-small font-semibold text-on-stamp"
        >
          Toggle {isDark ? 'light' : 'dark'}
        </button>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-section text-ink">Colours</h2>
        <div className="grid grid-cols-2 gap-4 tablet:grid-cols-3 desktop:grid-cols-4">
          <Swatch label="paper" className="bg-paper" />
          <Swatch label="card" className="bg-card" />
          <Swatch label="stamp" className="bg-stamp" textClassName="text-on-stamp" />
          <Swatch label="tested-bg" className="bg-tested-bg text-tested" />
          <Swatch label="sourced-bg" className="bg-sourced-bg text-sourced" />
          <Swatch label="uncertain-bg" className="bg-uncertain-bg text-uncertain" />
        </div>
      </section>

      <section className="rounded-md border border-rule bg-card p-card">
        <h2 className="text-card-title text-ink">Card surface</h2>
        <p className="mt-2 text-body text-ink-muted">
          Card padding is 16px on phone and 24px from the desktop breakpoint (1024px)
        </p>
      </section>
    </div>
  )
}

export default App
