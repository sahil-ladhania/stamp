/**
 * File: ThemeToggle.tsx
 * Purpose: Icon button that switches between light and dark mode.
 * Exports: ThemeToggle
 * Used by: SiteHeader
 */
import type { ReactElement } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/hooks/useTheme'

/** Shows the icon of the theme you will switch to. */
export function ThemeToggle(): ReactElement {
  const { isDark, toggleTheme } = useTheme()
  const Icon = isDark ? Sun : Moon

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      <Icon aria-hidden className="size-4" />
    </Button>
  )
}
