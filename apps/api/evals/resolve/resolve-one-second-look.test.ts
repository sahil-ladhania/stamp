/**
 * File: resolve-one-second-look.test.ts
 * Purpose: Tests the resolve-only runner's second look and retry, and how a replay says it would look again.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it, vi } from "vitest";
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
