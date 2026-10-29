/**
 * File: scopes.ts
 * Purpose: Classifies each scope in a guide as real, fake, off-surface or unverified against the golden set.
 * Exports: scopeKey, classifyScope, scoreScopes, ScopeClass, ScopeScore
 * Used by: evals/scoring/score-app.ts, evals/scoring/contradictions.ts
 */
import type { Golden } from "../lib/golden.js";

export type ScopeClass = "real" | "fake" | "off_surface" | "unverified";

export type ScopeScore = {
  total: number;
  real: string[];
  fake: string[];
  unverified: string[];
  offSurface: string[];
};

// Names a tutorial or template uses; they are never real for any provider.
const PLACEHOLDER =
  /^(app|my[_-]?app|example|sample|test|demo|foo|bar|your[_-]?scope|scope[_-]?\d*)([:._-](read|write|all|admin))?$/i;

/** A comparable form: lower case, no quotes, one space between words, and a scope URL reduced to its last segment. */
export function scopeKey(name: string): string {
  const cleaned = name
    .trim()
    .replace(/^[`'"]+|[`'"]+$/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
  if (!/^https?:\/\//.test(cleaned)) return cleaned;
  try {
    const url = new URL(cleaned);
    const segments = url.pathname.split("/").filter(Boolean);
    return segments[segments.length - 1] ?? url.hostname;
  } catch {
    return cleaned;
  }
}

/** Order matters: a listed real or fake name wins over the shape check, and a placeholder is fake for every provider. */
export function classifyScope(name: string, golden: Golden): ScopeClass {
  const key = scopeKey(name);
  const keys = (names: readonly string[]) => names.map(scopeKey);
  if (keys(golden.scopes.real.map((scope) => scope.name)).includes(key))
    return "real";
  if (keys(golden.scopes.knownFake).includes(key)) return "fake";
  if (keys(golden.scopes.offSurface?.names ?? []).includes(key))
    return "off_surface";
  if (PLACEHOLDER.test(key)) return "fake";
  const shape = new RegExp(
    golden.scopes.namePattern,
    golden.scopes.namePatternFlags,
  );
  const raw = name.trim().replace(/^[`'"]+|[`'"]+$/g, "");
  return shape.test(raw) ? "unverified" : "fake";
}

/** Groups a guide's scope names. A scope listed twice counts once in its group; `total` counts what the guide listed. */
export function scoreScopes(
  names: readonly string[],
  golden: Golden,
): ScopeScore {
  const groups: Record<ScopeClass, Map<string, string>> = {
    real: new Map(),
    fake: new Map(),
    off_surface: new Map(),
    unverified: new Map(),
  };
  for (const name of names) {
    const key = scopeKey(name);
    const group = groups[classifyScope(name, golden)];
    if (!group.has(key)) group.set(key, name);
  }
  return {
    total: names.length,
    real: [...groups.real.values()],
    fake: [...groups.fake.values()],
    unverified: [...groups.unverified.values()],
    offSurface: [...groups.off_surface.values()],
  };
}
