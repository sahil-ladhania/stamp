/**
 * File: index.js
 * Purpose: Shared ESLint flat config base for every Stamp workspace.
 * Exports: default config array
 * Used by: packages/eslint-config/node.js, packages/eslint-config/react.js
 */

// @ts-check

import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

/** @type {import('eslint').Linter.Config[]} */
export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**'],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
);
