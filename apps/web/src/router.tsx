/**
 * File: router.tsx
 * Purpose: The route table: the six product routes inside PageShell, with the not-found page as the catch-all.
 * Exports: router
 * Used by: App.tsx
 */
import { createBrowserRouter } from 'react-router'
import { PageShell } from '@/components/layout/PageShell'
import { AppHomePage } from '@/pages/AppHomePage'
import { GuidePage } from '@/pages/GuidePage'
import { HowWeVerifyPage } from '@/pages/HowWeVerifyPage'
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
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);