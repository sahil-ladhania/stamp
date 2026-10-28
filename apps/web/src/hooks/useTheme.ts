/**
 * File: useTheme.ts
 * Purpose: Holds the light/dark theme and a toggle that applies and stores it.
 * Exports: useTheme
 * Used by: components/layout/ThemeToggle.tsx
 */
import { useState } from 'react'
import { applyTheme, readCurrentTheme, storeTheme, type Theme } from '@/utils/theme'

type UseThemeResult = { theme: Theme; isDark: boolean; toggleTheme: () => void }

/** Theme state seeded from the class the inline script set before first paint. */
export function useTheme(): UseThemeResult {
  const [theme, setTheme] = useState<Theme>(readCurrentTheme)

  function toggleTheme(): void {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    storeTheme(next)
    setTheme(next)
  }

  return { theme, isDark: theme === 'dark', toggleTheme }
}
