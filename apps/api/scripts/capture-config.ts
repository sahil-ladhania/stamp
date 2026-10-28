/**
 * File: capture-config.ts
 * Purpose: What the fixture capture asks Tavily for: app names to resolve, apps to research in depth, queries and size caps.
 * Exports: RESOLVE_NAMES, RESOLVE_QUERIES, DOC_APPS, DOC_QUERIES, OPEN_QUERY, EDGE_URLS, LIMITS, CaptureApp
 * Used by: scripts/capture-run.ts
 */

export type CaptureApp = {
  /** Used in file names and queries. */
  id: string;
  name: string;
  /** Domains the official docs live on; searches are restricted to them. Best guess: the capture shows the truth. */
  domains: string[];
};

/** Names a user might type. Chosen to cover a clear case, an app whose docs sit on another domain, and likely ambiguity. */
export const RESOLVE_NAMES: string[] = [
  "Notion",
  "Slack",
  "HubSpot",
  "Linear",
  "Mercury",
  "Zzqx Unknownapp",
];

/** Two ways to ask for an app's official site; the resolve node will use whichever the captures favour. */
export const RESOLVE_QUERIES: {
  label: string;
  query: (name: string) => string;
}[] = [
  { label: "docs", query: (name) => `${name} API developer documentation` },
  { label: "site", query: (name) => `${name} official website` },
];

/** Apps captured end to end: restricted searches, one open search and the pages behind the best hits. */
export const DOC_APPS: CaptureApp[] = [
  { id: "notion", name: "Notion", domains: ["notion.com", "notion.so"] },
  { id: "slack", name: "Slack", domains: ["slack.com", "slack.dev"] },
  { id: "hubspot", name: "HubSpot", domains: ["hubspot.com"] },
];

/** The topics the plan covers; each runs restricted to the app's official domains. */
export const DOC_QUERIES: { label: string; query: (name: string) => string }[] =
  [
    {
      label: "setup",
      query: (name) => `${name} OAuth app setup client ID redirect URI`,
    },
    { label: "scopes", query: (name) => `${name} OAuth scopes permissions` },
    {
      label: "review",
      query: (name) => `${name} app review approval marketplace listing`,
    },
    {
      label: "limits",
      query: (name) => `${name} API rate limits install limits`,
    },
  ];

/** One search with no domain restriction, to capture third-party and forum hits. */
export const OPEN_QUERY = (name: string): string =>
  `${name} OAuth app approval how long does it take`;

/** Pages for edge cases: a page with almost no text, and a page that does not exist. */
export const EDGE_URLS: string[] = [
  "https://example.com/",
  "https://developers.notion.com/capture-test-page-that-does-not-exist",
];

export const LIMITS = {
  resolveMaxResults: 8,
  docMaxResults: 5,
  /** Characters of page text kept per page; longer pages are cut and recorded in `truncated`. */
  pageTextCap: 80_000,
  /** Pages per app, as in a real run. */
  maxPages: 6,
  searchTimeoutMs: 20_000,
  extractTimeoutMs: 45_000,
  /** Give up if the first calls all fail, so a bad key does not produce a wall of errors. */
  stopAfterFailures: 3,
};
