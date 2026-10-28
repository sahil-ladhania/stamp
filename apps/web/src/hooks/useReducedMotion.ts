/**
 * File: useReducedMotion.ts
 * Purpose: Reports whether the visitor asked their system for reduced motion.
 * Exports: useReducedMotion
 * Used by: components/landing/HeroVideo.tsx
 */
import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void): () => void {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getSnapshot(): boolean {
  return window.matchMedia(QUERY).matches;
}

/** True when the system asks for reduced motion; updates if the setting changes. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot);
}
