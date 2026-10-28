/**
 * File: fixture-schemas.ts
 * Purpose: Zod shapes of the saved Tavily fixtures under apps/api/tests/fixtures, shared by the capture script and the tests that load them.
 * Exports: SearchFixtureSchema, ExtractFixtureSchema, ManifestSchema, SearchFixture, ExtractFixture, Manifest
 * Used by: scripts/capture-run.ts, scripts/capture-fixtures.ts
 */
import { z } from "zod";

const Captured = {
  label: z.string().min(1),
  /** When the real call was made; fixtures are a snapshot and go stale. */
  capturedAt: z.string().datetime(),
};

/** One `searchWeb` call: the request that was made and the typed result it returned. */
export const SearchFixtureSchema = z.strictObject({
  kind: z.literal("search"),
  ...Captured,
  request: z.strictObject({
    query: z.string().min(1),
    includeDomains: z.array(z.string()),
    maxResults: z.number().int().positive(),
  }),
  result: z.strictObject({
    hits: z.array(
      z.strictObject({
        url: z.string().url(),
        title: z.string(),
        snippet: z.string(),
        score: z.number(),
      }),
    ),
    credits: z.number().nullable(),
  }),
});
export type SearchFixture = z.infer<typeof SearchFixtureSchema>;

/** One `extractPages` call. Page text is capped to keep files small; `truncated` records what was cut. */
export const ExtractFixtureSchema = z.strictObject({
  kind: z.literal("extract"),
  ...Captured,
  request: z.strictObject({ urls: z.array(z.string().url()) }),
  result: z.strictObject({
    pages: z.array(
      z.strictObject({
        url: z.string().url(),
        title: z.string().nullable(),
        text: z.string(),
      }),
    ),
    failed: z.array(z.strictObject({ url: z.string(), error: z.string() })),
    credits: z.number().nullable(),
  }),
  truncated: z.array(
    z.strictObject({
      url: z.string().url(),
      originalLength: z.number().int().positive(),
    }),
  ),
});
export type ExtractFixture = z.infer<typeof ExtractFixtureSchema>;

/** Index of one capture run: what was written, how big, and which calls failed. */
export const ManifestSchema = z.strictObject({
  capturedAt: z.string().datetime(),
  files: z.array(
    z.strictObject({
      file: z.string().min(1),
      kind: z.enum(["search", "extract"]),
      label: z.string().min(1),
      bytes: z.number().int().nonnegative(),
      /** Hits for a search, pages for an extract. */
      items: z.number().int().nonnegative(),
    }),
  ),
  failures: z.array(
    z.strictObject({ file: z.string().min(1), error: z.string() }),
  ),
});
export type Manifest = z.infer<typeof ManifestSchema>;
