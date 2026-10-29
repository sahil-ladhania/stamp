/**
 * File: researched-as.ts
 * Purpose: The "Researched as: <product> (<domain>)" line for the run page and the guide header, so a reader can see which product and domain the run took the app to be.
 * Exports: researchedAs
 * Used by: components/run/RunScreen.tsx, components/verdict/Verdict.tsx
 */

type Researched = { product?: string | null; appName: string; domain: string }

/** The product phrase when the run found one, else the app's name, with the primary domain. */
export function researchedAs({ product, appName, domain }: Researched): string {
  return `Researched as: ${product ?? appName} (${domain})`
}
