/**
 * File: useMockScenario.ts
 * Purpose: The one switch for mock scenarios: reads `?state=` and falls back to the default.
 * Exports: useMockScenario
 * Used by: pages (Landing, Not found, App home, Live run, Guide)
 */
import { useSearchParams } from "react-router";
import { parseScenario, SCENARIO_PARAM } from "@/utils/scenario";

/** The first value in `allowed` is the default; unknown `?state=` values fall back to it. */
export function useMockScenario<T extends string>(
  allowed: readonly [T, ...T[]],
): { scenario: T } {
  const [params] = useSearchParams();
  return { scenario: parseScenario(params.get(SCENARIO_PARAM), allowed) };
}
