/**
 * File: resolve-search.test.ts
 * Purpose: Tests Resolve's searching: one search for a clear answer, a retry when a search fails, and one second look, merged with the first hits, when the first answer is thin.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it, vi } from "vitest";
import type { ResolveHit } from "./candidates.js";
import { resolveFromHits } from "./resolve-from-hits.js";
import {
  RESOLVE_QUERY,
  SECOND_LOOK_QUERY,
  mergeHits,
  needsSecondLook,
  resolveWithSearch,
  type SearchFn,
} from "./resolve-search.js";

const hit = (url: string, title = ""): ResolveHit => ({ url, title });
const DOCS = [
  hit("https://developers.acme.com/docs/oauth", "OAuth | Acme API"),
  hit("https://developers.acme.com/docs/scopes", "Scopes | Acme API"),
];
const searchOf = (...answers: (ResolveHit[] | Error)[]): SearchFn =>
  vi.fn((_query: string) => {
    const answer = answers.shift() ?? [];
    return answer instanceof Error
      ? Promise.reject(answer)
      : Promise.resolve({ hits: answer, credits: 1 });
  });

describe("mergeHits", () => {
  it("keeps the first hits first and adds each new URL once", () => {
    const merged = mergeHits(
      [hit("https://a.com/1"), hit("https://a.com/2")],
      [hit("https://a.com/2"), hit("https://b.com/")],
    );
    expect(merged.map((h) => h.url)).toEqual([
      "https://a.com/1",
      "https://a.com/2",
      "https://b.com/",
    ]);
  });
});

describe("needsSecondLook", () => {
  it("is false for an official winner that has a documentation hit", () => {
    expect(needsSecondLook(resolveFromHits("Acme", DOCS))).toBe(false);
  });

  it("is true for an official winner whose only hit is a plain page", () => {
    expect(
      needsSecondLook(
        resolveFromHits("Acme", [hit("https://acme.com/", "Acme")]),
      ),
    ).toBe(true);
  });

  it("is true when nothing is decided", () => {
    expect(
      needsSecondLook(
        resolveFromHits("Acme", [hit("https://example.org/x", "Other")]),
      ),
    ).toBe(true);
    expect(needsSecondLook(resolveFromHits("Acme", []))).toBe(true);
  });
});

describe("resolveWithSearch", () => {
  it("searches once, with the resolve query, when the answer is clear", async () => {
    const search = searchOf(DOCS);
    const result = await resolveWithSearch("Acme", search);
    expect(search).toHaveBeenCalledTimes(1);
    expect(search).toHaveBeenCalledWith(RESOLVE_QUERY("Acme"), "first");
    expect(result).toMatchObject({
      lookedAgain: false,
      retried: false,
      credits: 1,
      queries: [RESOLVE_QUERY("Acme")],
    });
    expect(result.decision).toEqual({ kind: "official", domain: "acme.com" });
  });

  it("looks a second time, with another query, when nothing was decided, and decides on both lists", async () => {
    const search = searchOf([hit("https://example.org/x", "Other")], DOCS);
    const result = await resolveWithSearch("Acme", search);
    expect(search).toHaveBeenCalledTimes(2);
    expect(search).toHaveBeenLastCalledWith(SECOND_LOOK_QUERY("Acme"), "again");
    expect(result.decision).toEqual({ kind: "official", domain: "acme.com" });
    expect(result.hits).toHaveLength(3);
    expect(result).toMatchObject({
      lookedAgain: true,
      credits: 2,
      queries: [RESOLVE_QUERY("Acme"), SECOND_LOOK_QUERY("Acme")],
    });
  });

  it("keeps the first answer when the second look fails or finds nothing", async () => {
    const failing = await resolveWithSearch(
      "Acme",
      searchOf([hit("https://acme.com/", "Acme")], new Error("down")),
    );
    expect(failing.decision).toEqual({ kind: "official", domain: "acme.com" });
    expect(failing.lookedAgain).toBe(false);
    const empty = await resolveWithSearch(
      "Acme",
      searchOf([hit("https://example.org/x", "Other")], []),
    );
    expect(empty.decision).toEqual({ kind: "none" });
    expect(empty.lookedAgain).toBe(true);
  });

  it("retries a failed first search once, then decides", async () => {
    const search = searchOf(new Error("timeout"), DOCS);
    const result = await resolveWithSearch("Acme", search);
    expect(search).toHaveBeenCalledTimes(2);
    expect(search).toHaveBeenLastCalledWith(RESOLVE_QUERY("Acme"), "again");
    expect(result).toMatchObject({ retried: true, lookedAgain: false });
    expect(result.decision.kind).toBe("official");
  });

  it("throws the last error when the retry fails too, and tries nothing more", async () => {
    const search = searchOf(new Error("first"), new Error("second"));
    await expect(resolveWithSearch("Acme", search)).rejects.toThrow("second");
    expect(search).toHaveBeenCalledTimes(2);
  });

  it("does not retry or look again when the run is stopped", async () => {
    const stopped = searchOf(new Error("aborted"));
    await expect(
      resolveWithSearch("Acme", stopped, () => false),
    ).rejects.toThrow("aborted");
    expect(stopped).toHaveBeenCalledTimes(1);
    const noLook = searchOf([hit("https://example.org/x", "Other")]);
    await resolveWithSearch("Acme", noLook, () => false);
    expect(noLook).toHaveBeenCalledTimes(1);
  });

  it("does not use the word OAuth in either query", () => {
    expect(RESOLVE_QUERY("Gmail")).not.toMatch(/oauth/i);
    expect(SECOND_LOOK_QUERY("Gmail")).not.toMatch(/oauth/i);
  });
});
