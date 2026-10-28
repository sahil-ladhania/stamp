/**
 * File: ToastProvider.tsx
 * Purpose: Renders short toasts (for example "Link copied") and supplies showToast through context.
 * Exports: ToastProvider
 * Used by: App.tsx
 */
import { useCallback, useMemo, useRef, useState, type ReactElement, type ReactNode } from 'react'
import { Check, CircleAlert } from 'lucide-react'
import { Toast } from 'radix-ui'
import { cn } from '@/lib/utils'
import { ToastContext, type ToastOptions, type ToastTone } from '@/hooks/useToast'

type ToastItem = { id: number; message: string; tone: ToastTone }

const TOAST_DURATION_MS = 3000

/** Polite live region, bottom of the screen. Fade only, and the global reduced-motion rule applies. */
export function ToastProvider({ children }: { children: ReactNode }): ReactElement {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(0)

  const showToast = useCallback((message: string, options?: ToastOptions): void => {
    nextId.current += 1
    const item: ToastItem = { id: nextId.current, message, tone: options?.tone ?? 'neutral' }
    setToasts((current) => [...current, item])
  }, [])

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext value={value}>
      <Toast.Provider duration={TOAST_DURATION_MS} swipeDirection="down" label="Notifications">
        {children}
        {toasts.map((toast) => (
          <Toast.Root
            key={toast.id}
            type="background"
            onOpenChange={(isOpen) => {
              if (!isOpen) setToasts((current) => current.filter((item) => item.id !== toast.id))
            }}
            className={cn(
              'flex items-center gap-2 rounded-md border px-4 py-3 text-small data-[state=open]:animate-in data-[state=open]:fade-in-0',
              toast.tone === 'error' ? 'border-ink bg-card text-ink' : 'border-ink bg-ink text-paper',
            )}
          >
            {toast.tone === 'error' ? <CircleAlert aria-hidden className="size-4" /> : <Check aria-hidden className="size-4" />}
            <Toast.Description>{toast.message}</Toast.Description>
          </Toast.Root>
        ))}
        <Toast.Viewport className="fixed inset-x-4 bottom-4 z-50 flex flex-col gap-2 outline-none tablet:inset-x-auto tablet:right-6 tablet:bottom-6 tablet:w-80" />
      </Toast.Provider>
    </ToastContext>
  )
}
