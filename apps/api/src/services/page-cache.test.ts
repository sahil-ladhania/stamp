/**
 * File: page-cache.test.ts
 * Purpose: Tests the page cache against the in-memory page_cache table: hits, expiry, overwrite, URL variants, races.
 * Exports: (none)
 * Used by: vitest
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "../../generated/prisma/client.js";
import { fakeDb } from "../test-support/fake-db.js";
import { hashUrl } from "../utils/hash-url.js";
import { sha256Hex } from "../utils/sha256.js";

vi.mock("../lib/prisma.js", async () => ({
  prisma: (await import("../test-support/fake-db.js")).fakeDb.prisma,
}));

const { PAGE_CACHE_TTL_MS, getCachedPage, storePage } =
  await import("./page-cache.js");

const URL = "https://docs.example.com/oauth";
const T0 = new Date("2026-03-05T10:00:00.000Z");
const TEXT = "Create an app, then copy the client ID.";
const after = (ms: number): Date => new Date(T0.getTime() + ms);

beforeEach(() => fakeDb.reset());

describe("storePage and getCachedPage", () => {
  it("misses for a URL that was never stored", async () => {
    expect(await getCachedPage(URL, T0)).toBeNull();
  });

  it("stores a page and returns it as a PageRecord with its hashes and 7 day expiry", async () => {
    const stored = await storePage(
      { url: URL, tier: "official", text: TEXT },
      T0,
    );
    expect(stored).toEqual({
      url: URL,
      urlHash: hashUrl(URL),
      tier: "official",
      text: TEXT,
      contentHash: sha256Hex(TEXT),
      fetchedAt: T0.toISOString(),
      expiresAt: after(PAGE_CACHE_TTL_MS).toISOString(),
    });
    expect(await getCachedPage(URL, after(1000))).toEqual(stored);
  });

  it("keeps the expiry at exactly 7 days", () => {
    expect(PAGE_CACHE_TTL_MS).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it("saves the tier as the database enum and returns it in wire form", async () => {
    await storePage(
      { url: "https://forum.example.org/t/1", tier: "forum", text: TEXT },
      T0,
    );
    expect([...fakeDb.pageCache.rows.values()][0]?.tier).toBe("FORUM");
    expect(
      (await getCachedPage("https://forum.example.org/t/1", T0))?.tier,
    ).toBe("forum");
  });
});

describe("URL variants", () => {
  it("finds a page by any form of its URL and keeps one row", async () => {
    await storePage({ url: URL, tier: "official", text: TEXT }, T0);
    for (const variant of [
      `${URL}#scopes`,
      `${URL}?utm_source=news`,
      "https://DOCS.example.com:443/oauth",
    ]) {
      expect((await getCachedPage(variant, T0))?.text).toBe(TEXT);
    }
    await storePage(
      { url: `${URL}?utm_campaign=x#top`, tier: "official", text: TEXT },
      T0,
    );
    expect(fakeDb.pageCache.rows.size).toBe(1);
  });

  it("stores the URL in normal form so quotes and sources name the same page", async () => {
    const stored = await storePage(
      { url: `${URL}?b=2&a=1#x`, tier: "official", text: TEXT },
      T0,
    );
    expect(stored.url).toBe(`${URL}?a=1&b=2`);
  });

  it("treats different pages as different rows", async () => {
    await storePage(
      { url: URL, tier: "official", text: "one one one one" },
      T0,
    );
    await storePage(
      { url: `${URL}/scopes`, tier: "official", text: "two two two two" },
      T0,
    );
    expect(fakeDb.pageCache.rows.size).toBe(2);
    expect((await getCachedPage(`${URL}/scopes`, T0))?.text).toBe(
      "two two two two",
    );
  });
});

describe("freshness", () => {
  it("serves a page one millisecond before it expires", async () => {
    await storePage({ url: URL, tier: "official", text: TEXT }, T0);
    expect(
      await getCachedPage(URL, after(PAGE_CACHE_TTL_MS - 1)),
    ).not.toBeNull();
  });

  it("treats a page as stale at its expiry time and after", async () => {
    await storePage({ url: URL, tier: "official", text: TEXT }, T0);
    expect(await getCachedPage(URL, after(PAGE_CACHE_TTL_MS))).toBeNull();
    expect(
      await getCachedPage(URL, after(PAGE_CACHE_TTL_MS + 86_400_000)),
    ).toBeNull();
  });

  it("replaces a stale page with the fresh fetch: new text, new hash, new expiry, same row", async () => {
    await storePage(
      { url: URL, tier: "third_party", text: "old text for the page" },
      T0,
    );
    const later = after(PAGE_CACHE_TTL_MS + 1000);
    const fresh = await storePage(
      { url: URL, tier: "official", text: "new text for the page" },
      later,
    );
    expect(fakeDb.pageCache.rows.size).toBe(1);
    expect(fresh).toMatchObject({
      text: "new text for the page",
      tier: "official",
      fetchedAt: later.toISOString(),
    });
    expect(fresh.contentHash).toBe(sha256Hex("new text for the page"));
    expect(fresh.contentHash).not.toBe(sha256Hex("old text for the page"));
    expect(await getCachedPage(URL, later)).toEqual(fresh);
  });

  it("gives the same text the same content hash on every store", async () => {
    const a = await storePage({ url: URL, tier: "official", text: TEXT }, T0);
    const b = await storePage(
      { url: URL, tier: "official", text: TEXT },
      after(5000),
    );
    expect(b.contentHash).toBe(a.contentHash);
  });
});

describe("failures", () => {
  it("falls back to an update when another run stored the same URL at the same moment", async () => {
    await storePage(
      { url: URL, tier: "official", text: "winner text here" },
      T0,
    );
    fakeDb.pageCache.delegate.upsert.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "test",
      }),
    );
    const result = await storePage(
      { url: URL, tier: "official", text: "loser text here" },
      after(1000),
    );
    expect(fakeDb.pageCache.delegate.update).toHaveBeenCalledTimes(1);
    expect(result.text).toBe("loser text here");
  });

  it("does not hide other database errors", async () => {
    fakeDb.pageCache.delegate.upsert.mockRejectedValueOnce(
      new Error("db down"),
    );
    await expect(
      storePage({ url: URL, tier: "official", text: TEXT }, T0),
    ).rejects.toThrow("db down");
  });

  it("rejects a URL that is not http(s) before touching the database", async () => {
    await expect(
      storePage({ url: "ftp://x.com/f", tier: "official", text: TEXT }, T0),
    ).rejects.toThrow(TypeError);
    await expect(getCachedPage("not a url", T0)).rejects.toThrow(TypeError);
    expect(fakeDb.pageCache.delegate.upsert).not.toHaveBeenCalled();
    expect(fakeDb.pageCache.delegate.findUnique).not.toHaveBeenCalled();
  });

  it("refuses to cache a page with no text", async () => {
    await expect(
      storePage({ url: URL, tier: "official", text: " \n " }, T0),
    ).rejects.toThrow(RangeError);
    expect(fakeDb.pageCache.rows.size).toBe(0);
  });
});
