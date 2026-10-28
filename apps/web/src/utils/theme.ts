/**
 * File: theme.ts
 * Purpose: Reads, applies and stores the light/dark theme on the root element.
 * Exports: Theme, THEME_STORAGE_KEY, readCurrentTheme, applyTheme, storeTheme
 * Used by: hooks/useTheme.ts (index.html runs the same check inline before first paint)
 */

export type Theme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'stamp-theme'

/** Reads the theme the inline script in index.html already applied. */
export function readCurrentTheme(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

/** Switches the `.dark` class on the root element. */
export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

/** Saves the choice. Returns false when storage is blocked (private window, site data off). */
export function storeTheme(theme: Theme): boolean {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
    return true
  } catch {
    return false
  }
}
