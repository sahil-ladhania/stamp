/**
 * File: tuning-corpus.test.ts
 * Purpose: Pins what Resolve decides on every saved list of search hits for the six tuning apps: the answer must not change when Resolve changes.
 * Exports: (none)
 * Used by: vitest
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { resolveFromHits } from "./resolve-from-hits.js";

type Variant = {
  slug: string;
  source: string;
  typed: string;
  hits: { url: string; title: string }[];
  answer: {
    kind: string;
    domain: string | null;
    domains: string[];
    product: string | null;
    options: string[];
  };
};

const variants = JSON.parse(
  readFileSync(
    new URL("./fixtures/tuning-resolve-hits.json", import.meta.url),
    "utf8",
  ),
) as Variant[];

describe("the six tuning apps on their saved resolve hits", () => {
  it("has 16 saved lists", () => {
    expect(variants).toHaveLength(16);
  });

  it.each(
    variants.map(
      (variant, index) =>
        [`${variant.slug} #${index} (${variant.source})`, variant] as const,
    ),
  )("%s decides what it decided before", (_label, variant) => {
    const { decision, identity } = resolveFromHits(variant.typed, variant.hits);
    expect({
      kind: decision.kind,
      domain: decision.kind === "official" ? decision.domain : null,
      domains: identity?.domains ?? [],
      product: identity?.product ?? null,
      options:
        decision.kind === "ambiguous"
          ? decision.options.map((option) => option.domain)
          : [],
    }).toEqual(variant.answer);
  });
});
