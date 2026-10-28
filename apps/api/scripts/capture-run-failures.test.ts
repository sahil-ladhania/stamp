/**
 * File: capture-run-failures.test.ts
 * Purpose: Tests that the capture survives a failing call, gives up on a bad key, and rejects malformed results.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { fakeHits, makeDeps } from "./capture-fakes.js";
import { captureAll } from "./capture-run.js";

describe("captureAll failures", () => {
  it("records a failed call and still captures everything else", async () => {
    const { deps, written, logs } = makeDeps({
      search: (query, options) =>
        query.includes("Notion OAuth scopes")
          ? Promise.reject(new Error("Tavily search failed (status 500)"))
          : Promise.resolve(fakeHits(query, options.includeDomains)),
    });
    const manifest = await captureAll(deps);
    expect(manifest.failures).toEqual([
      {
        file: "search/notion-scopes.json",
        error: "Error: Tavily search failed (status 500)",
      },
    ]);
    expect(written.has("search/notion-scopes.json")).toBe(false);
    expect(written.has("search/notion-setup.json")).toBe(true);
    expect(written.has("pages/notion.json")).toBe(true);
    expect(manifest.files).toHaveLength(30);
    expect(
      logs.some((line) => line.startsWith("FAIL  search/notion-scopes.json")),
    ).toBe(true);
  });

  it("gives up after three failures with no success, so a bad key does not cause a wall of errors", async () => {
    const { deps, searches, written, logs } = makeDeps({
      search: () =>
        Promise.reject(new Error("Tavily search failed (status 401)")),
    });
    const manifest = await captureAll(deps);
    expect(manifest.failures).toHaveLength(3);
    expect(manifest.files).toHaveLength(0);
    expect(searches).toHaveLength(0);
    expect(logs.some((line) => line.includes("Check TAVILY_API_KEY"))).toBe(
      true,
    );
    expect(written.has("manifest.json")).toBe(true);
  });

  it("keeps going after three failures if something already succeeded", async () => {
    let calls = 0;
    const { deps } = makeDeps({
      search: (query, options) => {
        calls += 1;
        return calls > 1 && calls <= 5
          ? Promise.reject(new Error("Tavily search failed (status 500)"))
          : Promise.resolve(fakeHits(query, options.includeDomains));
      },
    });
    const manifest = await captureAll(deps);
    expect(manifest.failures).toHaveLength(4);
    expect(manifest.files.length).toBeGreaterThan(20);
  });

  it("rejects a malformed search result instead of writing it", async () => {
    const { deps, written } = makeDeps({
      search: () =>
        Promise.resolve({
          hits: [{ url: "not a url", title: "", snippet: "", score: 0 }],
          credits: null,
        }),
    });
    const manifest = await captureAll({ ...deps, write: deps.write });
    expect(manifest.failures[0]?.file).toBe("search/resolve-notion-docs.json");
    expect(written.has("search/resolve-notion-docs.json")).toBe(false);
  });

  it("skips an app's pages when its searches found nothing official", async () => {
    const { deps, extracts, logs, written } = makeDeps({
      search: () => Promise.resolve({ hits: [], credits: 1 }),
    });
    await captureAll(deps);
    expect(logs.filter((line) => line.startsWith("skip "))).toHaveLength(3);
    expect(written.has("pages/notion.json")).toBe(false);
    expect(extracts).toEqual([
      expect.arrayContaining(["https://example.com/"]),
    ]);
  });

  it("records a failed extraction without losing the searches", async () => {
    const { deps, written } = makeDeps({
      extract: () =>
        Promise.reject(new Error("Tavily extract failed (status 429)")),
    });
    const manifest = await captureAll(deps);
    expect(manifest.failures.map((failure) => failure.file)).toEqual([
      "pages/notion.json",
      "pages/slack.json",
      "pages/hubspot.json",
      "pages/edge.json",
    ]);
    expect(written.has("search/slack-limits.json")).toBe(true);
  });
});
