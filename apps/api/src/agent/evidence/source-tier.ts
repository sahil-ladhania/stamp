/**
 * File: source-tier.ts
 * Purpose: Classifies a URL as official, third_party or forum relative to the app's official domain.
 * Exports: sourceTier, normalizeDomain, isUnderDomain, OfficialDomains
 * Used by: agent/nodes/search.ts, agent/nodes/fetch.ts, agent/evidence/conflicts.ts
 */
import type { SourceTier } from "@stamp/schema";

// Sites that are user-generated Q&A or discussion, whoever runs them.
const FORUM_HOSTS = [
  "stackoverflow.com",
  "stackexchange.com",
  "serverfault.com",
  "superuser.com",
  "askubuntu.com",
  "reddit.com",
  "news.ycombinator.com",
  "quora.com",
];
// A subdomain like community.hubspot.com is user-generated even on the official domain.
const FORUM_LABELS = new Set([
  "community",
  "communities",
  "forum",
  "forums",
  "discuss",
  "discourse",
  "answers",
]);

/** True for the domain itself and any subdomain; "evilhubspot.com" is not under "hubspot.com". */
export function isUnderDomain(host: string, domain: string): boolean {
  return domain !== "" && (host === domain || host.endsWith(`.${domain}`));
}

/** Lowercase host without "www.", port, path or trailing dot; accepts a domain or a URL; "" if unusable. */
export function normalizeDomain(input: string): string {
  const text = input.trim().toLowerCase();
  if (text === "") {
    return "";
  }
  try {
    const url = new URL(text.includes("://") ? text : `https://${text}`);
    return url.hostname.replace(/^www\./, "").replace(/\.$/, "");
  } catch {
    return "";
  }
}

function hostOf(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.hostname.toLowerCase().replace(/\.$/, "");
  } catch {
    return null;
  }
}

/** One official domain or a company's several. */
export type OfficialDomains = string | readonly string[];

/**
 * Forum beats official: user-generated pages are not the provider speaking.
 * Anything unparseable, non-http or on another domain is third_party. A company with more than one
 * documentation domain (slack.com and slack.dev) passes them all; an unusable entry is ignored.
 */
export function sourceTier(
  url: string,
  officialDomains: OfficialDomains,
): SourceTier {
  const host = hostOf(url);
  if (host === null) {
    return "third_party";
  }
  const officials = (
    typeof officialDomains === "string" ? [officialDomains] : officialDomains
  )
    .map(normalizeDomain)
    .filter((domain) => domain !== "");
  const isOfficialHost = officials.some((domain) =>
    isUnderDomain(host, domain),
  );

  const labels = host.split(".");
  const officialIsForumHost = officials.some((domain) =>
    FORUM_LABELS.has(domain.split(".")[0] ?? ""),
  );
  const onForumSubdomain =
    labels.length >= 3 &&
    FORUM_LABELS.has(labels[0] ?? "") &&
    !(isOfficialHost && officialIsForumHost);
  const onForumSite =
    FORUM_HOSTS.some((forum) => isUnderDomain(host, forum)) && !isOfficialHost;
  if (onForumSubdomain || onForumSite) {
    return "forum";
  }
  return isOfficialHost ? "official" : "third_party";
}
