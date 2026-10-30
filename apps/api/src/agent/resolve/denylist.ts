/**
 * File: denylist.ts
 * Purpose: Sites that talk about an app but are never its official site, and the hints that a page is developer documentation.
 * Exports: DENY_DOMAINS, SHARED_HOSTING_DOMAINS, DOCS_PLATFORM_DOMAINS, DOCS_HOST_LABELS, DOCS_PATH_HINT
 * Used by: agent/resolve/candidates.ts, agent/resolve/official-domains.ts, agent/resolve/typed-input.ts, agent/evidence/source-tier.ts
 */

/**
 * Forums, aggregators, directories and code hosts. A domain here is skipped unless the app's name is the
 * site's own name ("GitHub" can still resolve to github.com).
 */
export const DENY_DOMAINS: ReadonlySet<string> = new Set([
  "stackoverflow.com",
  "stackexchange.com",
  "reddit.com",
  "quora.com",
  "medium.com",
  "dev.to",
  "hashnode.dev",
  "ycombinator.com",
  "youtube.com",
  "youtu.be",
  "wikipedia.org",
  "linkedin.com",
  "facebook.com",
  "twitter.com",
  "x.com",
  "instagram.com",
  "tiktok.com",
  "github.com",
  "gitlab.com",
  "npmjs.com",
  "pypi.org",
  "zapier.com",
  "ifttt.com",
  "pipedream.com",
  "rapidapi.com",
  "postman.com",
  "g2.com",
  "capterra.com",
  "trustpilot.com",
  "softwareadvice.com",
  "alternativeto.net",
  "producthunt.com",
  "crunchbase.com",
  "slideshare.net",
  "scribd.com",
]);

/**
 * Hosting platforms for documentation. A page there is the provider's own when its subdomain is the app's name
 * (pipedrive.readme.io): the platform's domain says nothing about who wrote the page.
 */
export const DOCS_PLATFORM_DOMAINS: readonly string[] = [
  "readme.io",
  "gitbook.io",
  "mintlify.app",
  "mintlify.dev",
];

/**
 * Domains that rent subdomains and paths to anyone, so their brand label belongs to whoever owns the page
 * (someone.github.io). They are never added as a company's second official domain.
 */
export const SHARED_HOSTING_DOMAINS: ReadonlySet<string> = new Set([
  "github.io",
  "gitlab.io",
  "netlify.app",
  "vercel.app",
  "pages.dev",
  "herokuapp.com",
  "readthedocs.io",
  ...DOCS_PLATFORM_DOMAINS,
  "notion.site",
  "blogspot.com",
  "wordpress.com",
  "web.app",
  "firebaseapp.com",
  "azurewebsites.net",
]);

/** First host labels that usually mean developer docs: docs.example.com, developers.example.com. */
export const DOCS_HOST_LABELS: ReadonlySet<string> = new Set([
  "docs",
  "doc",
  "developers",
  "developer",
  "dev",
  "api",
  "apidocs",
  "documentation",
]);

/** Path segments that usually mean developer docs. */
export const DOCS_PATH_HINT =
  /\/(?:docs?|api|developers?|oauth2?|reference)(?:[/?#-]|$)/i;
