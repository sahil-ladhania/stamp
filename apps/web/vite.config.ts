/**
 * File: vite.config.ts
 * Purpose: Vite dev/build config for apps/web (React, Tailwind v4, @ alias, dev proxy to the API).
 * Exports: default defineConfig
 * Used by: Vite CLI, dev server, vitest.config.ts
 */
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const API_DEV_TARGET = 'http://localhost:3000'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    // In dev the browser only talks to its own origin, so there is no CORS to configure.
    proxy: { '/api': API_DEV_TARGET },
  },
})
