/**
 * File: baseline-hits.ts
 * Purpose: The hits the resolve search returned for the six tuning apps in the first repetition of the clean baseline (2026-10-29), kept so identity tests run on real search results.
 * Exports: BASELINE_HITS, BaselineSlug
 * Used by: agent/resolve/official-domains.test.ts, agent/resolve/product-phrase.test.ts
 */
import type { ResolveHit } from "../candidates.js";

export type BaselineSlug =
  "github" | "gmail" | "hubspot" | "microsoft" | "notion" | "slack";

/** [url, title] pairs. Tuning apps only; no holdout app is ever used to build a fixture. */
const PAIRS: Record<BaselineSlug, [string, string][]> = {
  github: [
    [
      "https://blog.namespacecomm.in/github-api-demystified-a-developers-handbook",
      "Mastering the GitHub API: REST, GraphQL, Automation, and Collaboration",
    ],
    [
      "https://docs.github.com/en/rest",
      "GitHub REST API documentation - GitHub Docs",
    ],
    [
      "https://docs.github.com/en/integrations/concepts/github-developer-program",
      "GitHub Developer Program - GitHub Docs",
    ],
    [
      "https://docs.github.com/en/get-started/using-github-docs/github-docs-api",
      "GitHub Docs API - GitHub Docs",
    ],
    ["https://docs.github.com/", "GitHub Docs"],
    [
      "https://docs.github.com/rest/repos",
      "REST API endpoints for repositories - GitHub Docs",
    ],
    [
      "https://docs.github.com/rest/guides/getting-started-with-the-rest-api",
      "Getting started with the REST API",
    ],
  ],
  gmail: [
    [
      "https://developers.google.com/workspace/gmail/api/guides",
      "Gmail API overview  |  Google for Developers",
    ],
    [
      "https://dev.to/googleworkspace/gmail-api-developer-intro-spotting-chatty-threads-jnp",
      "Gmail API developer intro: spotting chatty threads - DEV Community",
    ],
    [
      "https://developers.google.com/workspace/gmail/api/reference/rest",
      "Gmail API  |  Google for Developers",
    ],
    [
      "https://www.youtube.com/watch?v=_yzh068bjbw&vl=en",
      "How to Create Gmail API App in the Google Developer (Step by Step Tutorial and Guide 2026-2027)",
    ],
    ["https://mailmeteor.com/blog/gmail-api", "How to Setup and Use Gmail API"],
    [
      "https://medium.com/@jasmosez/a-journey-into-the-gmail-api-and-back-be94900d4e19",
      "A Journey into the Gmail API and Back",
    ],
    [
      "https://www.reddit.com/r/googlecloud/comments/tcefqb/the_gmail_api_experience",
      "The Gmail API Experience : r/googlecloud",
    ],
    ["https://cloud.google.com/apis", "Cloud APIs | Google Cloud"],
  ],
  hubspot: [
    [
      "https://developers.hubspot.com/docs",
      "HubSpot Developer Documentation - HubSpot docs",
    ],
    ["https://developers.hubspot.com/postman", "HubSpot Developers | Postman"],
    ["https://apidog.com/blog/hubspot-api", "Must-know Guide for HubSpot API"],
    [
      "https://apitracker.io/a/hubspot",
      "HubSpot API Documentation - CRM & Marketing Integration",
    ],
    [
      "https://developers.hubspot.com/",
      "HubSpot Developers | Create tomorrow's solutions today on HubSpot's Developer Platform.",
    ],
    [
      "https://www.postman.com/hubspot/hubspot-public-api-workspace/overview",
      "HubSpot Public API Workspace",
    ],
    ["https://developers.hubspot.com/blog", "Developer Blog"],
    [
      "https://community.hubspot.com/t/where-is-my-developer-api-key/113930",
      "Page Not Found - HubSpot Community",
    ],
  ],
  microsoft: [
    [
      "https://apitracker.io/a/microsoft",
      "Microsoft API - Docs, SDKs & Integration",
    ],
    [
      "https://learn.microsoft.com/en-us/azure/api-management",
      "API Management documentation | Microsoft Learn",
    ],
    [
      "https://developer.microsoft.com/en-us/graph",
      "Microsoft Graph Dev Center | APIs and app development",
    ],
    [
      "https://learn.microsoft.com/en-us/rest/api/azure",
      "Azure REST API reference documentation | Microsoft Learn",
    ],
    [
      "https://learn.microsoft.com/en-us/microsoft-365/developer",
      "Microsoft 365 developer documentation - Microsoft 365 Developer | Microsoft Learn",
    ],
    ["https://developer.microsoft.com/en-us", "Microsoft Developer"],
    [
      "https://www.youtube.com/watch?v=TK_sK3_wL3U",
      "A Developer's Guide: From API Design to Deployment to Consumption",
    ],
    [
      "https://learn.microsoft.com/en-us/graph",
      "Microsoft Graph documentation | Microsoft Learn",
    ],
  ],
  notion: [
    [
      "https://developers.notion.com/reference/intro",
      "Introduction - Notion Docs",
    ],
    [
      "https://developers.notion.com/guides/get-started/overview",
      "Overview - Notion Docs",
    ],
    [
      "https://www.notion.com/help/create-integrations-with-the-notion-api",
      "Create integrations with the Notion API | Notion Help – Notion Help Center",
    ],
    [
      "https://www.notion.com/templates/category/api-documentation",
      "API Documentation Templates for Notion | Endpoints, Auth, Errors, Examples | Notion Marketplace",
    ],
    [
      "https://www.notion.com/product/dev",
      "Build with Notion’s Developer Platform – Notion",
    ],
    [
      "https://developers.notion.com/reference/property-object",
      "Data source properties - Notion Docs",
    ],
    [
      "https://www.notion.com/help/guides/connect-tools-to-notion-api",
      "Connect your tools to Notion with the API",
    ],
    [
      "https://developers.notion.com/reference/database",
      "Database - Notion Docs",
    ],
  ],
  slack: [
    ["https://docs.slack.dev/", "Slack developer docs | Slack Developer Docs"],
    [
      "https://slack.com/terms-of-service/api",
      "Slack API Terms of Service | Legal | Slack",
    ],
    [
      "https://slack.com/marketplace/APXEJ79UY-slack-developer-tools",
      "Slack Developer Tools & Slack Integration | Slack Marketplace",
    ],
    [
      "https://slack.com/help/articles/13345326945043-Build-apps-with-Slacks-developer-tools",
      "Build apps with Slack's developer tools | Slack",
    ],
    [
      "https://github.com/slackhq/slack-api-docs",
      "GitHub - slackhq/slack-api-docs: API Docs for Slack.com · GitHub",
    ],
    [
      "https://apitracker.io/a/slack",
      "Slack API - Developer docs, APIs, SDKs, and auth. | API Tracker",
    ],
    ["https://slack.dev/", "Developer Hub | Slack Developers"],
    ["https://x.com/SlackAPI?lang=en", "Slack Developers (@SlackAPI) / X"],
  ],
};

export const BASELINE_HITS = Object.fromEntries(
  Object.entries(PAIRS).map(([slug, pairs]) => [
    slug,
    pairs.map(([url, title]): ResolveHit => ({ url, title })),
  ]),
) as Record<BaselineSlug, ResolveHit[]>;
