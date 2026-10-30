/**
 * File: source-tier.ts
 * Purpose: Classifies a URL as official, third_party or forum relative to the app's official domains (and, for a documentation platform host, the app's name).
 * Exports: sourceTier, normalizeDomain, isUnderDomain, OfficialDomains
 * Used by: agent/nodes/search.ts, agent/nodes/fetch.ts, agent/evidence/conflicts.ts
 */
import type { SourceTier } from "@stamp/schema";
import { nameKey } from "../../utils/name-key.js";

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
const FORUM_LABELS = new Set(["discuss", "discourse", "answers"]);
/** Words that make a subdomain label a forum wherever they sit in it: community, devcommunity, forums, devforum. */
const FORUM_WORDS = /community|communities|forum/;
// Hosting platforms for documentation. A page there is the provider's own only when its subdomain is the app's name.
const DOCS_PLATFORMS = [
  "readme.io",
  "gitbook.io",
  "mintlify.app",
  "mintlify.dev",
];

const isForumLabel = (label: string): boolean =>
  FORUM_LABELS.has(label) || FORUM_WORDS.test(label);

/** "pipedrive.readme.io" for the app "Pipedrive": the label next to the platform is the app's name. */
function onOwnDocsPlatform(host: string, appName: string | undefined): boolean {
  const key = nameKey(appName ?? "");
  if (key === "") {
    return false;
  }
  return DOCS_PLATFORMS.some((platform) => {
    if (!host.endsWith(`.${platform}`)) {
      return false;
    }
    const subdomain = host
      .slice(0, -(platform.length + 1))
      .split(".")
      .pop();
    return nameKey(subdomain ?? "") === key;
  });
}

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
 * Forum beats official: user-generated pages are not the provider speaking, and a subdomain label with
 * "community" or "forum" in it is user-generated even on the official domain. Anything unparseable, non-http
 * or on another domain is third_party. A company with more than one documentation domain (slack.com and
 * slack.dev) passes them all; an unusable entry is ignored. With the app's name, a host on a known
 * documentation platform whose subdomain is that name (acme.readme.io for Acme) counts as official: a
 * provider's own docs often live there. This trusts whoever registered that name on the platform.
 */
export function sourceTier(
  url: string,
  officialDomains: OfficialDomains,
  options: { appName?: string } = {},
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
    isForumLabel(domain.split(".")[0] ?? ""),
  );
  const onForumSubdomain =
    labels.length >= 3 &&
    isForumLabel(labels[0] ?? "") &&
    !(isOfficialHost && officialIsForumHost);
  const onForumSite =
    FORUM_HOSTS.some((forum) => isUnderDomain(host, forum)) && !isOfficialHost;
  if (onForumSubdomain || onForumSite) {
    return "forum";
  }
  return isOfficialHost || onOwnDocsPlatform(host, options.appName)
    ? "official"
    : "third_party";
}
