# Resolve stress list

A list of providers to check Stage 0 (Resolve) alone: does the name or URL a reviewer types end on the right official docs domain? **The expected domains were written before any run of this list**, and are committed first.

## What an entry says

| Field | Meaning |
| --- | --- |
| `typed` | Exactly what is typed into the search box |
| `types` | The kinds of provider it stands for (below) |
| `expected` | The registrable domains the official OAuth docs live on. Any one of them is a correct answer. Checked by hand against the provider's own docs, most from a web search on 2026-10-30 |
| `docs` | An example docs page for a person to open. The domain is what is asserted; the exact path is a pointer, not checked page by page |
| `note` | Why the entry is hard, when that is not obvious |
| `control` | One of the six tuning apps, where Resolve has worked in every eval. A change to Resolve must keep them correct |

36 entries: 26 names and 6 controls need one search each (32 credits), 4 typed domains or URLs need none.

## Types

| Type | Meaning | Example |
| --- | --- | --- |
| `dev_subdomain` | Docs on a developer or docs subdomain of the brand's own domain | Spotify |
| `parent_domain` | Docs on another brand's domain: the parent company or a platform | QuickBooks (Intuit), YouTube (Google) |
| `brand_differs` | The docs domain's brand label differs from the name typed | Square (squareup.com), Front (frontapp.com) |
| `consumer_site_first` | The brand's own domain is a consumer or marketing site; the docs are elsewhere | YouTube, LinkedIn |
| `denied_brand_host` | The brand's own site is on Resolve's denylist (allowed only on an exact label match) | Reddit, GitLab, Zapier, TikTok, X |
| `docs_on_code_host` | The official docs are on github.com, a denied host | Basecamp, Reddit |
| `other_tld` | Docs on a different top-level domain from the brand's `.com` | Shopify (shopify.dev), Twitch (twitch.tv) |
| `common_word` | A plain word or a very short name | Box, Monday, Linear, Front |
| `multi_word` | Several words, one of which is the company | Google Calendar, Zoho CRM |
| `single_letter` | A one-letter name | X |
| `docs_platform` | Docs on a hosted docs platform (readme.io, gitbook, mintlify) | Pipedrive |
| `non_latin` | A name with no Latin letters | 钉钉 |
| `typed_domain` | Typed as a domain or URL: no search is made | Cal.com, a typed docs URL |
| `control` | The six tuning apps | GitHub, Gmail, HubSpot, Microsoft, Notion, Slack |

## How an answer is scored

| Outcome | Meaning |
| --- | --- |
| `ok` | Resolve picked an official domain, and it (or one of its other official domains) is in `expected` |
| `ok_asks` | Resolve asked "did you mean" and one option is in `expected`. Acceptable, but a reviewer is asked a question |
| `wrong_domain` | Resolve picked an official domain that is not in `expected`. The worst outcome: the guide is built from the wrong site |
| `ambiguous_wrong` | Resolve asked "did you mean" and no option is in `expected` |
| `no_docs` | NO_PUBLIC_DOCS |
| `error` | The search failed, so Resolve could not decide |

The six tuning apps are controls only. This list is not a golden set: it does not set a pass mark and nothing is tuned on a run of it without saying so.
