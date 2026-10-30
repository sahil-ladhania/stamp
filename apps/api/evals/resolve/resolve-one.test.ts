/**
 * File: resolve-one.test.ts
 * Purpose: Tests the resolve-only runner with a fake search: a typed domain makes no search, a name makes one with the resolve node's query, a failed search is recorded, and a replay decides again from saved hits.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it, vi } from "vitest";
import { RESOLVE_QUERY } from "../../src/agent/nodes/resolve.js";
import type { Entry, SearchFn } from "./resolve-one.js";
import { replayOne, resolveOne } from "./resolve-one.js";

const entry = (typed: string, expected: string[]): Entry => ({
  typed,
  types: ["dev_subdomain"],
  expected,
});
const hit = (url: string, title: string) => ({ url, title });
const searchOf = (
  hits: { url: string; title: string }[],
  credits: number | null = 1,
): SearchFn => vi.fn(() => Promise.resolve({ hits, credits }));

const SPOTIFY_HITS = [
  hit(
    "https://developer.spotify.com/documentation/web-api",
    "Web API | Spotify for Developers",
  ),
  hit(
    "https://developer.spotify.com/documentation/web-api/concepts/authorization",
    "Authorization | Spotify for Developers",
  ),
];

describe("resolveOne", () => {
  it("makes no search for a typed domain or URL, and reads its registrable domain", async () => {
    const search = searchOf([]);
    const record = await resolveOne(
      entry("https://developer.spotify.com/x", ["spotify.com"]),
      search,
    );
    expect(search).not.toHaveBeenCalled();
    expect(record).toMatchObject({
      via: "typed",
      decision: "official",
      domain: "spotify.com",
      outcome: "ok",
      credits: null,
    });
  });

  it("scores a typed docs-platform host by its platform domain, which is wrong", async () => {
    const record = await resolveOne(
      entry("pipedrive.readme.io", ["pipedrive.readme.io"]),
      searchOf([]),
    );
    expect(record.domain).toBe("readme.io");
    expect(record.outcome).toBe("wrong_domain");
  });

  it("searches a name once with the resolve node's query and keeps the hits and credits", async () => {
    const search = searchOf(SPOTIFY_HITS, 1);
    const record = await resolveOne(entry("Spotify", ["spotify.com"]), search);
    expect(search).toHaveBeenCalledTimes(1);
    expect(search).toHaveBeenCalledWith(RESOLVE_QUERY("Spotify"), "first");
    expect(record).toMatchObject({
      via: "search",
      decision: "official",
      outcome: "ok",
      credits: 1,
      queries: [RESOLVE_QUERY("Spotify")],
    });
    expect(record.hits).toEqual(SPOTIFY_HITS);
    expect(record.candidates[0]?.domain).toBe("spotify.com");
  });

  it("ends no_docs when no hit matches the name", async () => {
    const record = await resolveOne(
      entry("Spotify", ["spotify.com"]),
      searchOf([hit("https://example.org/a", "Other")]),
    );
    expect(record).toMatchObject({
      decision: "none",
      outcome: "no_docs",
      domain: null,
    });
  });

  it("records a failed search as an error, not as no docs, and does not throw", async () => {
    const search: SearchFn = () =>
      Promise.reject(new Error("Tavily search failed (status 432)"));
    const record = await resolveOne(entry("Spotify", ["spotify.com"]), search);
    expect(record).toMatchObject({
      decision: "error",
      outcome: "error",
      error: "Error: Tavily search failed (status 432)",
    });
  });

  it("ends no_docs, with no search, for text that has nothing to look up", async () => {
    const search = searchOf([]);
    const record = await resolveOne(entry("   ", ["x.com"]), search);
    expect(search).not.toHaveBeenCalled();
    expect(record).toMatchObject({ via: "empty", outcome: "no_docs" });
  });
});

describe("replayOne", () => {
  it("decides again from the saved hits, with no search, and uses the entry's expected domains", async () => {
    const saved = await resolveOne(
      entry("Spotify", ["elsewhere.com"]),
      searchOf(SPOTIFY_HITS),
    );
    expect(saved.outcome).toBe("wrong_domain");
    const again = replayOne(entry("Spotify", ["spotify.com"]), saved);
    expect(again).toMatchObject({
      outcome: "ok",
      hits: SPOTIFY_HITS,
      credits: saved.credits,
    });
  });

  it("falls back to the saved record when the entry is no longer in the list", async () => {
    const saved = await resolveOne(
      entry("Spotify", ["spotify.com"]),
      searchOf(SPOTIFY_HITS),
    );
    expect(replayOne(undefined, saved).outcome).toBe("ok");
  });

  it("keeps a failed search a failed search", async () => {
    const saved = await resolveOne(entry("Spotify", ["spotify.com"]), () =>
      Promise.reject(new Error("x")),
    );
    expect(replayOne(entry("Spotify", ["spotify.com"]), saved).outcome).toBe(
      "error",
    );
  });
});

describe("resolveOne and the second look", () => {
  it("searches again when the first search decided nothing, and records both queries and the credits", async () => {
    const answers = [[hit("https://example.org/a", "Other")], SPOTIFY_HITS];
    const search: SearchFn = vi.fn(() =>
      Promise.resolve({ hits: answers.shift() ?? [], credits: 1 }),
    );
    const record = await resolveOne(entry("Spotify", ["spotify.com"]), search);
    expect(search).toHaveBeenCalledTimes(2);
    expect(record).toMatchObject({
      lookedAgain: true,
      retried: false,
      credits: 2,
      outcome: "ok",
    });
    expect(record.queries).toHaveLength(2);
    expect(record.hits).toHaveLength(3);
  });

  it("records a retried first search", async () => {
    const answers: (Error | { hits: typeof SPOTIFY_HITS; credits: number })[] =
      [new Error("502"), { hits: SPOTIFY_HITS, credits: 1 }];
    const search: SearchFn = () => {
      const next = answers.shift();
      return next instanceof Error || next === undefined
        ? Promise.reject(next)
        : Promise.resolve(next);
    };
    expect(
      await resolveOne(entry("Spotify", ["spotify.com"]), search),
    ).toMatchObject({ retried: true, outcome: "ok", error: null });
  });
});

describe("replayOne and the second look", () => {
  it("says a replay of one thin search would look again, and one that already did would not", async () => {
    const thin = [hit("https://example.org/a", "Other")];
    const once = await resolveOne(entry("Spotify", ["spotify.com"]), () =>
      Promise.resolve({ hits: thin, credits: 1 }),
    );
    expect(once.lookedAgain).toBe(true);
    const saved = {
      ...once,
      queries: once.queries.slice(0, 1),
      lookedAgain: false,
    };
    expect(
      replayOne(entry("Spotify", ["spotify.com"]), saved).wouldLookAgain,
    ).toBe(true);
    expect(
      replayOne(entry("Spotify", ["spotify.com"]), once).wouldLookAgain,
    ).toBe(false);
  });

  it("replays a record saved with the single `query` of the first version", async () => {
    const saved = await resolveOne(
      entry("Spotify", ["spotify.com"]),
      searchOf(SPOTIFY_HITS),
    );
    const { queries, ...rest } = saved;
    const old = { ...rest, query: queries[0] } as unknown as typeof saved;
    expect(replayOne(entry("Spotify", ["spotify.com"]), old)).toMatchObject({
      outcome: "ok",
      queries,
    });
  });
});
