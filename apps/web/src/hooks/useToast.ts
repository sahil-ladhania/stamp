/**
 * File: useToast.ts
 * Purpose: Toast context and the hook components call to show a short message.
 * Exports: ToastTone, ToastOptions, ToastContext, useToast
 * Used by: components/shared/ToastProvider.tsx, copy-link buttons, KitPreviewPage
 */
import { createContext, useContext } from 'react'

export type ToastTone = 'neutral' | 'error'
export type ToastOptions = { tone?: ToastTone }
type ToastContextValue = { showToast: (message: string, options?: ToastOptions) => void }

export const ToastContext = createContext<ToastContextValue | null>(null)

/** Returns `showToast`. Throws when used outside ToastProvider, which is a wiring bug. */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used inside ToastProvider')
  }
  return context
}
