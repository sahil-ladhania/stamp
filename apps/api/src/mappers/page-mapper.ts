/**
 * File: page-mapper.ts
 * Purpose: Map Prisma PageCache rows to in-memory PageRecord for the agent.
 * Exports: toPageRecord
 * Used by: services/page-cache.ts, agent fetch nodes
 */
import type { PageCache as PrismaPageCache } from "../../generated/prisma/client.js";
import type { PageRecord } from "../agent/page-record.js";
import { toWireSourceTier } from "./enum-wire.js";

/** Converts a cached page row to agent working memory (text stays server-side). */
export function toPageRecord(row: PrismaPageCache): PageRecord {
  return {
    url: row.url,
    urlHash: row.urlHash,
    tier: toWireSourceTier(row.tier),
    text: row.text,
    contentHash: row.contentHash,
    fetchedAt: row.fetchedAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
  };
}
