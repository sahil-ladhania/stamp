/**
 * File: main.tsx
 * Purpose: React entry point; loads fonts and mounts App.
 * Exports: none (side-effect bootstrap)
 * Used by: index.html
 */
import '@fontsource-variable/inter'
import '@fontsource-variable/jetbrains-mono'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
