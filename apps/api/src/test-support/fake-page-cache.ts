/**
 * File: fake-page-cache.ts
 * Purpose: In-memory stand-in for the Prisma page_cache table (primary key urlHash).
 * Exports: createFakePageCache
 * Used by: test-support/fake-db.ts
 */
import { vi } from "vitest";
import type { PageCache } from "../../generated/prisma/client.js";

type PageFields = Omit<PageCache, "urlHash">;

/** A fresh table plus the delegate methods the page-cache service calls. */
export function createFakePageCache() {
  const rows = new Map<string, PageCache>();

  const delegate = {
    findUnique: vi.fn(
      async ({ where }: { where: { urlHash: string } }) =>
        rows.get(where.urlHash) ?? null,
    ),
    upsert: vi.fn(
      async ({
        where,
        create,
        update,
      }: {
        where: { urlHash: string };
        create: PageCache;
        update: PageFields;
      }) => {
        const existing = rows.get(where.urlHash);
        const row = existing ? Object.assign(existing, update) : { ...create };
        rows.set(where.urlHash, row);
        return row;
      },
    ),
    update: vi.fn(
      async ({
        where,
        data,
      }: {
        where: { urlHash: string };
        data: PageFields;
      }) => {
        const existing = rows.get(where.urlHash);
        if (!existing) throw new Error("Record to update not found");
        return Object.assign(existing, data);
      },
    ),
  };

  return {
    rows,
    delegate,
    reset: (): void => {
      rows.clear();
      Object.values(delegate).forEach((fn) => fn.mockReset());
    },
  };
}
