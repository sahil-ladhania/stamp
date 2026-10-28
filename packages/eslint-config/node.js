/**
 * File: node.js
 * Purpose: ESLint flat config for Node packages (API, @stamp/schema).
 * Exports: default config array
 * Used by: packages/schema/eslint.config.js, apps/api (later)
 */

// @ts-check

import globals from 'globals';
import baseConfig from './index.js';

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...baseConfig,
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
];
