/**
 * File: sha256.ts
 * Purpose: SHA-256 hex digest of a string; the one hash used for URL keys and page content hashes.
 * Exports: sha256Hex
 * Used by: utils/hash-url.ts, services/page-cache.ts, agent/nodes/fetch.ts
 */
import { createHash } from "node:crypto";

/** Hex SHA-256 of the UTF-8 bytes of `text` (64 lowercase characters). */
export function sha256Hex(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}
