/**
 * File: mock-scenario.ts
 * Purpose: Names for local UI mock scenarios (no provider facts invented here).
 * Exports: MockScenario
 * Used by: future mocks under src/mocks when added
 */

export type MockScenario =
  | "library-hubspot"
  | "live-running"
  | "live-partial"
  | "run-error-ambiguous";
