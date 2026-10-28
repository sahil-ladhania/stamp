/**
 * File: useTheme.ts
 * Purpose: Shared light/dark theme: every caller sees a change made by any other caller.
 * Exports: useTheme
 * Used by: components/layout/ThemeToggle.tsx, components/landing/HeroVideo.tsx
 */
import { useSyncExternalStore } from "react";
import {
  applyTheme,
  readCurrentTheme,
  storeTheme,
  subscribeToTheme,
  type Theme,
} from "@/utils/theme";

type UseThemeResult = {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
};

/** The root `.dark` class is the single source of truth; this hook only observes it. */
export function useTheme(): UseThemeResult {
  const theme = useSyncExternalStore(subscribeToTheme, readCurrentTheme);

  function toggleTheme(): void {
    const next: Theme = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    storeTheme(next);
  }

  return { theme, isDark: theme === "dark", toggleTheme };
}
