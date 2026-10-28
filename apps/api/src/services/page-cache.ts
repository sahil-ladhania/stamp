/**
 * File: page-cache.ts
 * Purpose: Page cache: fetched page text kept 7 days by URL hash, with a content hash proving which version a quote was checked against.
 * Exports: getCachedPage, storePage, PAGE_CACHE_TTL_MS
 * Used by: agent/nodes/fetch.ts
 */
import type { SourceTier } from "@stamp/schema";
import type { PageRecord } from "../agent/page-record.js";
import { isUniqueViolation } from "../lib/prisma-errors.js";
import { prisma } from "../lib/prisma.js";
import { toPrismaSourceTier } from "../mappers/enum-wire.js";
import { toPageRecord } from "../mappers/page-mapper.js";
import { hashUrl, normalizeUrl } from "../utils/hash-url.js";
import { sha256Hex } from "../utils/sha256.js";

/** Fetched pages stay valid for 7 days (docs/product-architecture.md section 6). */
export const PAGE_CACHE_TTL_MS = 7 * 24 * 60 * 60_000;

/** The cached page for a URL if it is still fresh, else null. Throws TypeError for a non-http(s) URL. */
export async function getCachedPage(
  url: string,
  now: Date = new Date(),
): Promise<PageRecord | null> {
  const row = await prisma.pageCache.findUnique({
    where: { urlHash: hashUrl(url) },
  });
  if (!row || row.expiresAt <= now) {
    return null;
  }
  return toPageRecord(row);
}

/**
 * Stores a fetched page, replacing any earlier version of the same URL.
 * The URL is saved in normal form and `contentHash` is the SHA-256 of the exact text stored,
 * so a later quote check can say which version it ran against.
 */
export async function storePage(
  input: { url: string; tier: SourceTier; text: string },
  now: Date = new Date(),
): Promise<PageRecord> {
  if (input.text.trim() === "") {
    throw new RangeError("Cannot cache a page with no text");
  }
  const url = normalizeUrl(input.url);
  const urlHash = hashUrl(url);
  const fields = {
    url,
    tier: toPrismaSourceTier(input.tier),
    text: input.text,
    contentHash: sha256Hex(input.text),
    fetchedAt: now,
    expiresAt: new Date(now.getTime() + PAGE_CACHE_TTL_MS),
  };
  try {
    return toPageRecord(
      await prisma.pageCache.upsert({
        where: { urlHash },
        create: { urlHash, ...fields },
        update: fields,
      }),
    );
  } catch (err) {
    if (!isUniqueViolation(err)) {
      throw err;
    }
    // Two runs stored the same new URL at once; the row now exists, so update it.
    return toPageRecord(
      await prisma.pageCache.update({ where: { urlHash }, data: fields }),
    );
  }
}
