/**
 * File: providers.ts
 * Purpose: Loads and checks the resolve stress list (providers.json): what is typed, the kinds of provider it stands for and the docs domains that count as correct.
 * Exports: loadProviders, needsSearch, PROVIDER_TYPES, Provider, PROVIDERS_FILE
 * Used by: evals/resolve/cli.ts, evals/resolve/resolve-one.ts
 */
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { parseTyped } from "../../src/agent/resolve/typed-input.js";

export const PROVIDER_TYPES = [
  "dev_subdomain",
  "parent_domain",
  "brand_differs",
  "consumer_site_first",
  "denied_brand_host",
  "docs_on_code_host",
  "other_tld",
  "common_word",
  "multi_word",
  "single_letter",
  "docs_platform",
  "non_latin",
  "typed_domain",
  "control",
] as const;

const ProviderSchema = z.strictObject({
  typed: z.string().min(1),
  types: z.array(z.enum(PROVIDER_TYPES)).min(1),
  /** Domains the official OAuth docs live on; any one is a correct answer. */
  expected: z.array(z.string().regex(/^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/)).min(1),
  docs: z.string().url(),
  note: z.string().min(1).optional(),
  control: z.literal(true).optional(),
});
export type Provider = z.infer<typeof ProviderSchema>;

export const PROVIDERS_FILE = fileURLToPath(
  new URL("./providers.json", import.meta.url),
);

/** The list, checked: every entry valid, no name listed twice, and an entry typed as a domain says so. */
export async function loadProviders(
  file: string = PROVIDERS_FILE,
): Promise<Provider[]> {
  const providers = z
    .array(ProviderSchema)
    .parse(JSON.parse(await readFile(file, "utf8")));
  const seen = new Set<string>();
  for (const provider of providers) {
    const key = provider.typed.toLowerCase();
    if (seen.has(key))
      throw new Error(`"${provider.typed}" is in the list twice`);
    seen.add(key);
    if (
      provider.types.includes("typed_domain") !==
      (parseTyped(provider.typed).kind === "domain")
    ) {
      throw new Error(
        `"${provider.typed}": the typed_domain type must match how it is read`,
      );
    }
    if ((provider.control === true) !== provider.types.includes("control")) {
      throw new Error(
        `"${provider.typed}": control and the control type go together`,
      );
    }
  }
  return providers;
}

/** A name needs one search; a domain or URL does not. */
export function needsSearch(provider: Pick<Provider, "typed">): boolean {
  const typed = parseTyped(provider.typed);
  return typed.kind === "name" && typed.name !== "";
}
