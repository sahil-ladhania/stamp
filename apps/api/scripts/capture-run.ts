/**
 * File: capture-run.ts
 * Purpose: Runs the fixture capture against injected Tavily functions: every search and extract call, validated and written, plus a manifest.
 * Exports: captureAll, describePlan, CaptureDeps
 * Used by: scripts/capture-fixtures.ts
 */
import type { ExtractResult, SearchResult } from "../src/lib/tavily.js";
import {
  ExtractFixtureSchema,
  ManifestSchema,
  SearchFixtureSchema,
  type Manifest,
} from "../src/test-support/fixture-schemas.js";
import { slugify } from "../src/utils/slugify.js";
import {
  DOC_APPS,
  DOC_QUERIES,
  EDGE_URLS,
  LIMITS,
  OPEN_QUERY,
  RESOLVE_NAMES,
  RESOLVE_QUERIES,
} from "./capture-config.js";
import { capPages, pickPageUrls } from "./capture-pages.js";

export type CaptureDeps = {
  search: (
    query: string,
    options: { includeDomains: string[]; maxResults: number },
  ) => Promise<SearchResult>;
  extract: (urls: string[]) => Promise<ExtractResult>;
  /** Writes JSON under the fixtures folder and returns the file size in bytes. */
  write: (file: string, data: unknown) => Promise<number>;
  log: (line: string) => void;
  now: () => Date;
};

type Built<T> = { fixture: unknown; items: number; value: T };

function errorText(err: unknown): string {
  return err instanceof Error ? `${err.name}: ${err.message}` : "unknown error";
}

/** The calls a full capture makes, one line each, with a rough Tavily credit count. */
export function describePlan(): string[] {
  const resolveCalls = RESOLVE_NAMES.length * RESOLVE_QUERIES.length;
  const docCalls = DOC_APPS.length * (DOC_QUERIES.length + 1);
  const extractCalls = DOC_APPS.length + 1;
  return [
    `${resolveCalls} resolve searches: ${RESOLVE_NAMES.join(", ")} x ${RESOLVE_QUERIES.map((q) => q.label).join(" and ")}`,
    `${docCalls} documentation searches: ${DOC_APPS.map((app) => app.name).join(", ")} x ${DOC_QUERIES.length} topics plus 1 open search`,
    `${extractCalls} page extractions: up to ${LIMITS.maxPages} pages for each of ${DOC_APPS.length} apps, plus ${EDGE_URLS.length} edge-case URLs`,
    `About ${resolveCalls + docCalls + extractCalls * 2} Tavily credits in total; files go to apps/api/tests/fixtures/`,
  ];
}

/** Makes every call, writes each result as soon as it is validated, and never stops for one failure. */
export async function captureAll(deps: CaptureDeps): Promise<Manifest> {
  const capturedAt = deps.now().toISOString();
  const files: Manifest["files"] = [];
  const failures: Manifest["failures"] = [];
  let stopped = false;

  /** Runs one call and writes its fixture; null means it failed or the capture already gave up. */
  async function record<T>(
    file: string,
    kind: "search" | "extract",
    label: string,
    build: () => Promise<Built<T>>,
  ): Promise<T | null> {
    if (stopped) {
      return null;
    }
    try {
      const { fixture, items, value } = await build();
      const bytes = await deps.write(file, fixture);
      files.push({ file, kind, label, bytes, items });
      deps.log(
        `ok    ${file} (${items} ${kind === "search" ? "hits" : "pages"}, ${Math.ceil(bytes / 1024)} KB)`,
      );
      return value;
    } catch (err) {
      failures.push({ file, error: errorText(err) });
      deps.log(`FAIL  ${file}: ${errorText(err)}`);
      if (files.length === 0 && failures.length >= LIMITS.stopAfterFailures) {
        stopped = true;
        deps.log(
          "Stopping: the first calls all failed. Check TAVILY_API_KEY and your network.",
        );
      }
      return null;
    }
  }

  const searchStep = (
    file: string,
    label: string,
    query: string,
    includeDomains: string[],
    maxResults: number,
  ) =>
    record(file, "search", label, async () => {
      const value = await deps.search(query, { includeDomains, maxResults });
      const fixture = SearchFixtureSchema.parse({
        kind: "search",
        label,
        capturedAt,
        request: { query, includeDomains, maxResults },
        result: value,
      });
      return { fixture, items: value.hits.length, value };
    });

  const extractStep = (file: string, label: string, urls: string[]) =>
    record(file, "extract", label, async () => {
      const { result, truncated } = capPages(
        await deps.extract(urls),
        LIMITS.pageTextCap,
      );
      const fixture = ExtractFixtureSchema.parse({
        kind: "extract",
        label,
        capturedAt,
        request: { urls },
        result,
        truncated,
      });
      return { fixture, items: result.pages.length, value: result };
    });

  for (const name of RESOLVE_NAMES) {
    for (const variant of RESOLVE_QUERIES) {
      await searchStep(
        `search/resolve-${slugify(name)}-${variant.label}.json`,
        `resolve ${name} (${variant.label})`,
        variant.query(name),
        [],
        LIMITS.resolveMaxResults,
      );
    }
  }

  for (const app of DOC_APPS) {
    const topics: SearchResult[] = [];
    for (const topic of DOC_QUERIES) {
      const found = await searchStep(
        `search/${app.id}-${topic.label}.json`,
        `${app.name} ${topic.label}`,
        topic.query(app.name),
        app.domains,
        LIMITS.docMaxResults,
      );
      if (found) {
        topics.push(found);
      }
    }
    const open = await searchStep(
      `search/${app.id}-open.json`,
      `${app.name} open search`,
      OPEN_QUERY(app.name),
      [],
      LIMITS.docMaxResults,
    );
    const urls = pickPageUrls(topics, open, app.domains, LIMITS.maxPages);
    if (urls.length === 0) {
      deps.log(
        `skip  pages/${app.id}.json: the searches found no pages to fetch`,
      );
      continue;
    }
    await extractStep(`pages/${app.id}.json`, `${app.name} pages`, urls);
  }

  await extractStep("pages/edge.json", "edge cases", EDGE_URLS);

  const manifest = ManifestSchema.parse({ capturedAt, files, failures });
  await deps.write("manifest.json", manifest);
  return manifest;
}
