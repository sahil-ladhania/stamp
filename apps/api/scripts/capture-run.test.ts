/**
 * File: capture-run.test.ts
 * Purpose: Tests a full capture against fake Tavily functions: the calls made, the files written and the manifest.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import {
  ExtractFixtureSchema,
  ManifestSchema,
  SearchFixtureSchema,
} from "../src/test-support/fixture-schemas.js";
import {
  DOC_APPS,
  EDGE_URLS,
  LIMITS,
  RESOLVE_NAMES,
} from "./capture-config.js";
import { makeDeps } from "./capture-fakes.js";
import { captureAll, describePlan } from "./capture-run.js";

describe("captureAll", () => {
  it("makes 27 searches and 4 extractions", async () => {
    const { deps, searches, extracts } = makeDeps();
    await captureAll(deps);
    expect(searches).toHaveLength(
      RESOLVE_NAMES.length * 2 + DOC_APPS.length * 5,
    );
    expect(extracts).toHaveLength(DOC_APPS.length + 1);
  });

  it("resolves each name unrestricted, asking for 8 results", async () => {
    const { deps, searches } = makeDeps();
    await captureAll(deps);
    const resolve = searches.filter((s) =>
      s.query.includes("official website"),
    );
    expect(resolve).toHaveLength(RESOLVE_NAMES.length);
    expect(
      resolve.every(
        (s) =>
          s.includeDomains.length === 0 &&
          s.maxResults === LIMITS.resolveMaxResults,
      ),
    ).toBe(true);
  });

  it("restricts the topic searches to the app's domains and leaves the open search unrestricted", async () => {
    const { deps, searches } = makeDeps();
    await captureAll(deps);
    const notion = searches.filter(
      (s) =>
        s.query.startsWith("Notion OAuth") ||
        s.query.startsWith("Notion app") ||
        s.query.startsWith("Notion API rate"),
    );
    expect(
      notion.filter((s) => s.includeDomains.join() === "notion.com,notion.so"),
    ).toHaveLength(4);
    expect(
      notion.filter((s) => s.includeDomains.length === 0).map((s) => s.query),
    ).toEqual(["Notion OAuth app approval how long does it take"]);
  });

  it("writes one valid file per call, with the request and result in it", async () => {
    const { deps, written } = makeDeps();
    await captureAll(deps);
    const search = SearchFixtureSchema.parse(
      written.get("search/notion-setup.json"),
    );
    expect(search.request.includeDomains).toEqual(["notion.com", "notion.so"]);
    expect(search.request.maxResults).toBe(LIMITS.docMaxResults);
    expect(search.result.hits.length).toBeGreaterThan(0);
    expect(search.capturedAt).toBe("2026-03-05T10:00:00.000Z");
    for (const file of [
      "search/resolve-notion-docs.json",
      "search/resolve-zzqx-unknownapp-site.json",
      "search/slack-open.json",
    ]) {
      expect(SearchFixtureSchema.safeParse(written.get(file)).success).toBe(
        true,
      );
    }
  });

  it("fetches up to 6 pages per app, official ones plus one from outside", async () => {
    const { deps, extracts, written } = makeDeps();
    await captureAll(deps);
    const notionUrls = extracts[0] ?? [];
    expect(notionUrls.length).toBeLessThanOrEqual(LIMITS.maxPages);
    expect(
      notionUrls.filter((url) => url.includes("developers.notion.com")),
    ).toHaveLength(notionUrls.length - 1);
    expect(notionUrls.at(-1)).toContain("blog.example.net");
    const pages = ExtractFixtureSchema.parse(written.get("pages/notion.json"));
    expect(pages.request.urls).toEqual(notionUrls);
  });

  it("fetches the edge-case URLs in their own file", async () => {
    const { deps, extracts, written } = makeDeps();
    await captureAll(deps);
    expect(extracts.at(-1)).toEqual(EDGE_URLS);
    expect(
      ExtractFixtureSchema.safeParse(written.get("pages/edge.json")).success,
    ).toBe(true);
  });

  it("cuts long page text to the cap and records it", async () => {
    const { deps, written } = makeDeps({
      extract: (urls) =>
        Promise.resolve({
          pages: urls.map((url) => ({
            url,
            title: null,
            text: "y".repeat(LIMITS.pageTextCap + 5),
          })),
          failed: [],
          credits: null,
        }),
    });
    await captureAll(deps);
    const pages = ExtractFixtureSchema.parse(written.get("pages/hubspot.json"));
    expect(
      pages.result.pages.every(
        (page) => page.text.length === LIMITS.pageTextCap,
      ),
    ).toBe(true);
    expect(pages.truncated).toHaveLength(pages.result.pages.length);
    expect(pages.truncated[0]?.originalLength).toBe(LIMITS.pageTextCap + 5);
  });

  it("writes a manifest listing every file with its size and item count", async () => {
    const { deps, written } = makeDeps();
    const manifest = await captureAll(deps);
    expect(ManifestSchema.parse(written.get("manifest.json"))).toEqual(
      manifest,
    );
    expect(manifest.failures).toEqual([]);
    expect(manifest.files).toHaveLength(27 + 4);
    const setup = manifest.files.find(
      (file) => file.file === "search/notion-setup.json",
    );
    expect(setup).toMatchObject({ kind: "search", items: 3 });
    expect(setup?.bytes).toBeGreaterThan(0);
  });

  it("logs one line per file", async () => {
    const { deps, logs } = makeDeps();
    await captureAll(deps);
    expect(logs.filter((line) => line.startsWith("ok "))).toHaveLength(31);
  });
});

describe("describePlan", () => {
  it("lists the calls and the rough credit cost without making any", () => {
    const lines = describePlan();
    expect(lines.join("\n")).toContain("12 resolve searches");
    expect(lines.join("\n")).toContain("15 documentation searches");
    expect(lines.join("\n")).toContain("4 page extractions");
    expect(lines.at(-1)).toContain("Tavily credits");
  });
});
