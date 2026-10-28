/**
 * File: vite.config.ts
 * Purpose: Vite dev/build config for apps/web (React, Tailwind v4, @ alias).
 * Exports: default defineConfig
 * Used by: Vite CLI, dev server
 */
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
