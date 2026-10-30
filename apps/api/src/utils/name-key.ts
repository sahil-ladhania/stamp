/**
 * File: name-key.ts
 * Purpose: Reduces an app name, domain label or title to lowercase letters and digits so they can be compared.
 * Exports: nameKey, textKey
 * Used by: agent/queries.ts, agent/evidence/source-tier.ts, agent/resolve/candidates.ts
 */

/** "HubSpot CRM" -> "hubspotcrm"; accents are dropped. Empty for text with no Latin letters or digits. */
export function nameKey(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Like `nameKey`, but letters and digits of any script stay ("钉钉" -> "钉钉"), so a name in another script can be
 * found in a title, an address or a snippet. Resolve compares with this; other callers keep the Latin-only key.
 */
export function textKey(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "");
}
