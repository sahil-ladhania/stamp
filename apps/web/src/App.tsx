/**
 * File: App.tsx
 * Purpose: App root: tooltip and toast providers around the router.
 * Exports: default App
 * Used by: main.tsx
 */
import type { ReactElement } from 'react'
import { RouterProvider } from 'react-router'
import { ToastProvider } from '@/components/shared/ToastProvider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { router } from './router'

function App(): ReactElement {
  return (
    <TooltipProvider delayDuration={150}>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </TooltipProvider>
  )
}

export default App
