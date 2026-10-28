/**
 * File: vitest.config.ts
 * Purpose: Vitest config for apps/web: reuses the Vite config (alias) and runs plain unit tests in Node.
 * Exports: default defineConfig
 * Used by: `pnpm --filter web test`
 */
import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'node',
      include: ['src/**/*.test.ts'],
    },
  }),
)
