/**
 * File: state.test.ts
 * Purpose: Tests the state channels' reducers through the graph: append-and-dedupe lists, sticky partial, merged drafts.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { createHarness } from "../test-support/graph-harness.js";
import { PIPELINE } from "./pipeline.js";
import { stageNode } from "./stage-node.js";
import { appendUnique } from "./state.js";

const page = (url: string) => ({
  url,
  urlHash: `hash:${url}`,
  tier: "official" as const,
  text: "text",
  contentHash: "c",
  fetchedAt: "2026-01-01T00:00:00.000Z",
  expiresAt: "2026-01-08T00:00:00.000Z",
});

describe("appendUnique", () => {
  const byId = appendUnique((item: { id: string }) => item.id);

  it("appends new items after the existing ones", () => {
    expect(byId([{ id: "a" }], [{ id: "b" }])).toEqual([
      { id: "a" },
      { id: "b" },
    ]);
  });

  it("drops an item whose key is already held, keeping the first", () => {
    expect(byId([{ id: "a" }], [{ id: "a" }, { id: "b" }])).toEqual([
      { id: "a" },
      { id: "b" },
    ]);
  });

  it("drops duplicates inside the added list", () => {
    expect(byId([], [{ id: "a" }, { id: "a" }])).toEqual([{ id: "a" }]);
  });

  it("returns the same array when nothing is new", () => {
    const current = [{ id: "a" }];
    expect(byId(current, [{ id: "a" }])).toBe(current);
  });
});

describe("state channels", () => {
  it("starts every run with empty lists and no result", async () => {
    const final = await createHarness().run();
    expect(final).toMatchObject({
      typed: "Notion",
      slug: "notion",
      app: null,
      queries: [],
      searchResults: [],
      pages: [],
      drafts: {},
      claims: [],
      retryCount: 0,
      missingSections: [],
      guide: null,
      failure: null,
      partial: false,
    });
  });

  it("appends pages across nodes and ignores a page fetched twice", async () => {
    const final = await createHarness().run({
      fetch: stageNode("fetch", () =>
        Promise.resolve({ pages: [page("https://a.example.com/x")] }),
      ),
      extract: stageNode("extract", () =>
        Promise.resolve({
          pages: [
            page("https://a.example.com/x"),
            page("https://a.example.com/y"),
          ],
        }),
      ),
    });
    expect(final.pages.map((item) => item.url)).toEqual([
      "https://a.example.com/x",
      "https://a.example.com/y",
    ]);
  });

  it("keeps partial once any node sets it, even if a later node sets false", async () => {
    const final = await createHarness().run({
      plan: stageNode("plan", () => Promise.resolve({ partial: true })),
      search: stageNode("search", () => Promise.resolve({ partial: false })),
    });
    expect(final.partial).toBe(true);
  });

  it("merges drafts by section instead of replacing them", async () => {
    const final = await createHarness().run({
      extract: stageNode("extract", () =>
        Promise.resolve({
          drafts: {
            steps: { status: "drafted", payload: { steps: [] } },
            limits: { status: "unknown" },
          },
        }),
      ),
      verify: stageNode("verify", () =>
        Promise.resolve({
          drafts: { limits: { status: "failed", reason: "schema_failed" } },
        }),
      ),
    });
    expect(final.drafts).toEqual({
      steps: { status: "drafted", payload: { steps: [] } },
      limits: { status: "failed", reason: "schema_failed" },
    });
  });

  it("records each completed stage once", async () => {
    const final = await createHarness().run();
    expect(final.completed).toEqual(PIPELINE.map((item) => item.stage));
  });
});
