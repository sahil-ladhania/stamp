/**
 * File: react.js
 * Purpose: ESLint flat config for the React web app.
 * Exports: default config array
 * Used by: apps/web (later)
 */

// @ts-check

import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import baseConfig from './index.js';

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...baseConfig,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },
  {
    ...react.configs.flat.recommended,
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  reactHooks.configs.flat.recommended,
];
