/**
 * File: fresh-page-cache.test.ts
 * Purpose: Tests the page cache that never remembers: always a miss, and a stored page comes back as a record that is already expired.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { hashUrl } from "../../src/utils/hash-url.js";
import { sha256Hex } from "../../src/utils/sha256.js";
import { freshPageCache } from "./fresh-page-cache.js";

const NOW = new Date("2026-10-29T10:00:00.000Z");

describe("freshPageCache", () => {
  const cache = freshPageCache(() => NOW);

  it("never has a page", async () => {
    await cache.store({
      url: "https://docs.acme.com/a",
      tier: "official",
      text: "text",
    });
    expect(await cache.get("https://docs.acme.com/a")).toBeNull();
  });

  it("returns a record with the URL hash, content hash and tier", async () => {
    const record = await cache.store({
      url: "https://docs.acme.com/a",
      tier: "official",
      text: "hello world",
    });
    expect(record).toMatchObject({
      url: "https://docs.acme.com/a",
      urlHash: hashUrl("https://docs.acme.com/a"),
      tier: "official",
      text: "hello world",
      contentHash: sha256Hex("hello world"),
      fetchedAt: NOW.toISOString(),
    });
  });

  it("marks the record expired the moment it is fetched, so nothing reuses it", async () => {
    const record = await cache.store({
      url: "https://docs.acme.com/a",
      tier: "official",
      text: "x",
    });
    expect(record.expiresAt).toBe(record.fetchedAt);
  });

  it("rejects a page with no text, as the database cache does", async () => {
    await expect(
      cache.store({
        url: "https://docs.acme.com/a",
        tier: "official",
        text: "  ",
      }),
    ).rejects.toThrow(RangeError);
  });
});
