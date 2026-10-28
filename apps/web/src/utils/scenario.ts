/**
 * File: scenario.ts
 * Purpose: Pure parser for the `?state=` mock scenario switch.
 * Exports: SCENARIO_PARAM, parseScenario
 * Used by: hooks/useMockScenario.ts
 */

export const SCENARIO_PARAM = 'state'

/** Returns the raw value when it is allowed, otherwise the first (default) value. */
export function parseScenario<T extends string>(raw: string | null, allowed: readonly [T, ...T[]]): T {
  return allowed.find((value) => value === raw) ?? allowed[0]
}
