/**
 * File: stress-corpus.test.ts
 * Purpose: Replays the saved stress hits through Resolve and pins the outcome for every provider, so each fix shows which providers it changed. A second search is not replayed (it returns nothing new here).
 * Exports: (none)
 * Used by: vitest
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { Provider } from "./providers.js";
import { resolveOne, type ResolveRecord } from "./resolve-one.js";

type Entry = Pick<Provider, "typed" | "types" | "expected"> & {
  via: string;
  hits: { url: string; title: string; snippet: string }[];
  before: {
    outcome: string;
    decision: string;
    domain: string | null;
    domains: string[];
    product: string | null;
    options: string[];
  };
};

const entries = JSON.parse(
  readFileSync(new URL("./fixtures/stress-hits.json", import.meta.url), "utf8"),
) as Entry[];

/** Where a provider's outcome differs from the run of 2026-10-30. Each fix adds the providers it changed. */
const CHANGED: Record<string, ResolveRecord["outcome"]> = {
  // Fix E: a directory page is no candidate, so QuickBooks is no longer a question.
  QuickBooks: "ok",
  // Fix C: an exact label with no documentation page loses to another brand's documentation that names the app.
  YouTube: "ok",
  // Fixes B and D: the name counts in an address or a snippet, and a denied site's documentation page that names the app is kept.
  Instagram: "ok",
  钉钉: "ok",
  // Fix B: one documentation site is all the hits agree on, so Resolve asks about it instead of ending.
  Twitter: "ok_asks",
  // Fix F: a typed docs-platform host is looked up by its name.
  "pipedrive.readme.io": "ok",
};

/** Fix A: the providers whose first answer is thin, so Resolve searches once more (5 of 33 searches: +5 credits on a full run). */
const LOOK_AGAIN = ["Box", "LinkedIn", "Twitter", "Basecamp", "Slack"];

/** A typed docs-platform host is now looked up by its name, so it takes the hits of that name's search. */
const BORROWED_HITS: Record<string, Entry["hits"]> = Object.fromEntries(
  entries
    .filter((e) => e.typed === "Pipedrive")
    .map((e) => ["pipedrive.readme.io", e.hits]),
);

/** The first search returns the saved hits; a second look finds nothing new. */
async function replay(entry: Entry): Promise<ResolveRecord> {
  const hits =
    entry.hits.length > 0 ? entry.hits : (BORROWED_HITS[entry.typed] ?? []);
  let calls = 0;
  return resolveOne(
    { typed: entry.typed, types: entry.types, expected: entry.expected },
    () => Promise.resolve({ hits: calls++ === 0 ? hits : [], credits: null }),
  );
}

describe("the stress hits of 2026-10-30", () => {
  it("has the 36 providers", () => {
    expect(entries).toHaveLength(36);
  });

  it.each(entries.map((entry) => [entry.typed, entry] as const))(
    "%s",
    async (_typed, entry) => {
      const record = await replay(entry);
      expect(record.outcome).toBe(CHANGED[entry.typed] ?? entry.before.outcome);
    },
  );

  it("keeps every tuning app on the answer it had", async () => {
    for (const entry of entries.filter((e) => e.types.includes("control"))) {
      const record = await replay(entry);
      expect({
        domain: record.domain,
        domains: record.domains,
        product: record.product,
      }).toEqual({
        domain: entry.before.domain,
        domains: entry.before.domains,
        product: entry.before.product,
      });
    }
  });

  it("looks a second time for exactly the providers whose first answer is thin", async () => {
    const looked: string[] = [];
    for (const entry of entries) {
      if ((await replay(entry)).lookedAgain) looked.push(entry.typed);
    }
    expect(looked).toEqual(LOOK_AGAIN);
  });
});
