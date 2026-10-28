/**
 * File: router.tsx
 * Purpose: The route table: six product routes inside PageShell, plus the temporary /_kit preview.
 * Exports: router
 * Used by: App.tsx
 */
import { createBrowserRouter } from 'react-router'
import { PageShell } from '@/components/layout/PageShell'
import { AppHomePage } from '@/pages/AppHomePage'
import { GuidePage } from '@/pages/GuidePage'
import { HowWeVerifyPage } from '@/pages/HowWeVerifyPage'
import { KitPreviewPage } from '@/pages/KitPreviewPage'
import { LandingPage } from '@/pages/LandingPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { RunPage } from '@/pages/RunPage'

export const router = createBrowserRouter([
  {
    element: <PageShell />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/how-we-verify', element: <HowWeVerifyPage /> },
      { path: '/app', element: <AppHomePage /> },
      { path: '/run/:id', element: <RunPage /> },
      { path: '/g/:slug', element: <GuidePage /> },
      { path: '/_kit', element: <KitPreviewPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
