/**
 * File: name-key.ts
 * Purpose: Reduces an app name, domain label or title to lowercase letters and digits so they can be compared.
 * Exports: nameKey
 * Used by: agent/queries.ts, agent/resolve/candidates.ts
 */

/** "HubSpot CRM" -> "hubspotcrm"; accents are dropped. Empty for text with no Latin letters or digits. */
export function nameKey(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}
