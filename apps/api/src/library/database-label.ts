/**
 * File: database-label.ts
 * Purpose: Names the database a URL points at by host, port and database name only, so a seed run can say where it would write without printing the user or the password.
 * Exports: databaseLabel
 * Used by: scripts/db-seed.ts
 */

/** `host:port/database`; the user and password never appear, even when the URL is not valid. */
export function databaseLabel(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}:${parsed.port || "3306"}${parsed.pathname}`;
  } catch {
    return "an unreadable DATABASE_URL";
  }
}
