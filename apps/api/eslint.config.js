/**
 * File: eslint.config.js
 * Purpose: ESLint entry for the API; shared node rules, generated Prisma client ignored.
 * Exports: default config array
 * Used by: pnpm --filter api lint
 */

import nodeConfig from "@stamp/eslint-config/node";

// An underscore prefix marks a parameter or variable as intentionally unused.
const unusedUnderscore = {
  rules: {
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      },
    ],
  },
};

export default [
  { ignores: ["generated/**", ".agents/**", ".claude/**", ".windsurf/**"] },
  ...nodeConfig,
  unusedUnderscore,
];
