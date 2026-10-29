# Diagnosis: why Stamp's guides are not yet trustworthy

Baseline run of the tuning set (6 apps, one run each), 2026-10-29. Nothing was fixed. This document says what is wrong, where it enters the pipeline, and how much each cause matters.

- Run files: `apps/api/evals/runs/2026-10-29T14-39-20Z/` (git-ignored: guides, traces, scores, `scorecard.md`).
- Golden set: `apps/api/evals/golden/` (approved). Harness commit: `012e55e` on `eval/harness`.
- Cost of the run: $1.04 and 60 Tavily credits (estimate was $1.05 and 66).

## 1. The result in five lines

1. Of 188 Sourced claims, **only 38 (20%) stand on the right product's current official docs.** 94 rest on another product's pages, 17 on Slack's legacy docs, 39 on third-party pages.
2. The pages that answer the questions were usually **in the search results and never read**: 12 of 32 golden pages appeared in the results (counting two Slack pages under their old host, `api.slack.com`, which redirects to the golden URLs), and 1 was fetched.
3. Every check passes these claims, because **verify asks "is the quote on the page", never "is this the right page"** (`evidence/labelling.ts:29-40`).
4. Milestone fields: **0 of 24 are durations**, 9 are Unknown, 15 are prose.
5. Time is not the problem: runs used 20 to 32% of the 120 s budget, and a retry that read two more pages found nothing new.

## 2. Scorecard

| App       | Time (s) | Pages | Retries | Wrong-product | Gate                        | Wait    | Real / listed scopes | Fake scopes | Durations or Unknown | Top blocker | Contradictions | Uncertain | Cost  |
| --------- | -------- | ----- | ------- | ------------- | --------------------------- | ------- | -------------------- | ----------- | -------------------- | ----------- | -------------- | --------- | ----- |
| github    | 33.2     | 6     | 1       | 1             | wrong (required_to_scale)   | unknown | 0/0                  | 0           | 2/4                  | pass        | 15             | 41%       | $0.18 |
| gmail     | 27.6     | 4     | 0       | 1             | match (security_assessment) | unknown | 1/2                  | 1           | 1/4                  | none        | 8              | 26%       | $0.19 |
| hubspot   | 24.0     | 4     | 0       | 0             | unknown                     | unknown | 2/2                  | 0           | 2/4                  | none        | 0              | 58%       | $0.15 |
| microsoft | 37.4     | 4     | 0       | 1             | unknown                     | unknown | 3/11                 | 4           | 1/4                  | pass        | 12             | 30%       | $0.17 |
| notion    | 37.8     | 4     | 0       | 0             | match (optional_listing)    | unknown | 0/2                  | 2           | 1/4                  | manual      | 2              | 14%       | $0.19 |
| slack     | 25.1     | 4     | 0       | 0             | unknown                     | unknown | 3/9                  | 1           | 2/4                  | fail        | 1              | 38%       | $0.16 |
| **Total** | p95 37.8 | 26    | 1       | 3             | 2/6                         | 0/6     | 3 of 6 apps with 2+  | 8           | 9/24                 | 2 pass      | 38             | 34%       | $1.04 |

| Metric                                         | Target          | Baseline                                           |
| ---------------------------------------------- | --------------- | -------------------------------------------------- |
| Wrong-product sources                          | 0               | 3 (5 confirmed, see section 7)                     |
| Sourced claims that contradict the golden set  | 0               | 38                                                 |
| Review gate correct                            | at least 5 of 6 | 2 of 6                                             |
| Apps with at least 2 real scopes               | at least 5 of 6 | 3 of 6                                             |
| Fake or tutorial scopes                        | 0               | 8                                                  |
| Milestone fields that are durations or Unknown | 100%            | 9 of 24 (38%)                                      |
| Top blocker is a setup or approval blocker     | at least 5 of 6 | 2 pass, 1 by hand (fails on inspection, section 7) |
| Runs that end within 120 s                     | 100%            | 6 of 6                                             |
| p95 run time                                   | at most 100 s   | 37.8 s                                             |
| Uncertain share                                | report          | 34%                                                |
| Cost per run                                   | report          | $0.17                                              |

**Uncertain share is not a quality signal here.** Notion has the lowest share (14%) and the worst guide: 64 of its 66 Sourced claims quote one help article about connecting Snowflake. HubSpot has the highest share (58%) and is the cleanest guide on every check we have. Report the share of Sourced claims on good pages next to it.

## 3. How failures were counted

- One **cell** is one app against one item of the trust contract (the default seven-item contract): 6 apps x items 1 to 6 = 36 cells. Item 7 (ends within 120 s) passed everywhere.
- **25 of 36 cells fail.** Each is assigned to the stage that **first could have prevented it, given what that stage had in hand**. If the right page was in the search results and the wrong one was read, the fault is the selection, not the search.
- A second column names the guard that should have stopped it and did not.
- Sources of evidence: `<slug>.trace.json` (events and log lines), `<slug>.score.json`, `<slug>.guide.json` in the run folder. Page identities for three pages were confirmed by fetching them (section 7).

## 4. Failure inventory

Contract items: 1 pages about this app's API, 2 review gate, 3 real scopes, 4 durations, 5 top blocker, 6 third party never decides alone.

| #        | App       | Item | What was wrong                                                                                              | Entered at   | Not stopped by       | Evidence                                                                                                                          |
| -------- | --------- | ---- | ----------------------------------------------------------------------------------------------------------- | ------------ | -------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 1        | github    | 1    | 14 of 19 Sourced claims cite `docs.github.com/en/actions/reference/limits`, a different product             | Select/Fetch | Verify               | Fetched first by score; `scopes-for-oauth-apps` was in the results 4 times and never fetched                                      |
| 2        | gmail     | 1    | 7 Sourced claims cite the Contact Center AI Platform page                                                   | Select/Fetch | Verify               | `docs.cloud.google.com/contact-center/...` is the first page held; 4 of 6 golden pages in the results, 0 fetched                  |
| 3        | notion    | 1    | 64 of 66 Sourced claims cite one help article about connecting Snowflake                                    | Select/Fetch | Verify               | `www.notion.com/zh-cn/help/set-up-the-snowflake-mcp-for-notion` held first; its text begins "connect Snowflake to a Custom Agent" |
| 4        | microsoft | 1    | 8 claims cite Azure AD B2C, 1 cites an Azure DevOps blog                                                    | Plan         | Select/Fetch, Verify | None of 7 golden pages in the results; queries never say Graph or Entra                                                           |
| 5        | slack     | 1    | 17 Sourced claims cite legacy docs (`api.slack.com/docs/oauth*` redirect to `docs.slack.dev/legacy/...`)    | Resolve      | Verify               | Official domain chosen: `slack.com` (5.14) over `slack.dev` (4.70); no `docs.slack.dev` page anywhere in the results              |
| 6        | github    | 2    | Gate `required_to_scale`; golden is none or optional_listing                                                | Extract      | Verify               | The only provider-relevant page held is customer-side org approval; the evidence quote is not captured (section 8)                |
| 7        | hubspot   | 2    | Gate and wait unknown                                                                                       | Select/Fetch | Budget               | `app-marketplace-listing-requirements` was result 14, never fetched; no retry fired                                               |
| 8        | microsoft | 2    | Gate and wait unknown                                                                                       | Plan         | none                 | Publisher verification and consent pages not in the results                                                                       |
| 9        | slack     | 2    | Gate and wait unknown                                                                                       | Select/Fetch | Budget               | `api.slack.com/slack-marketplace/review-guide` (same article as the golden `docs.slack.dev` page) in the results, not fetched     |
| 10       | github    | 3    | No scopes at all                                                                                            | Select/Fetch | Budget               | Scopes section "nothing_found" twice; the retry fetched `octokit/auth-oauth-app.js` and a GraphQL limits page                     |
| 11       | gmail     | 3    | Only `gmail.modify` is real; `mail.google.com` (host only, not `https://mail.google.com/`)                  | Select/Fetch | Verify               | Both scopes quote the third-party blog (`mail.google.com - full access (restricted)`); `gmail/api/auth/scopes` was in the results |
| 12       | notion    | 3    | Scopes `session:role:` and `session:role:all`, which are Snowflake's                                        | Select/Fetch | Verify               | Quote: "use the Notion scope session:role:" from the Snowflake article                                                            |
| 13       | microsoft | 3    | `app.read`, `app.write`, `.default` (B2C page) and `user_impersonation` (DevOps blog) Sourced as scopes     | Extract      | Verify               | Quote: "(for example, app.read and app.write)"                                                                                    |
| 14       | slack     | 3    | `chat:write:user` (legacy) plus 5 classic scopes outside the golden list                                    | Resolve      | Verify               | Cited to the legacy pages in #5                                                                                                   |
| 15 to 20 | all six   | 4    | No milestone is a duration; 15 prose, 9 Unknown                                                             | Extract      | none                 | Prompt asks "what it takes" (`prompts/extract-sections.ts:29-31`); examples in section 6, H5                                      |
| 21       | gmail     | 5    | Verdict names no top blocker although 6 blockers exist                                                      | Extract      | none                 | `topBlockerId: null`                                                                                                              |
| 22       | hubspot   | 5    | No blockers, and the verdict says "no major blockers" as Sourced                                            | Select/Fetch | Verify               | Blockers section "nothing_found"; the review page was never read                                                                  |
| 23       | notion    | 5    | Top blocker is `invalid_client` from the Snowflake article                                                  | Select/Fetch | Verify               | Scorer says "manual"; fails on inspection                                                                                         |
| 24       | slack     | 5    | Top blocker is a redirect-URI note from a third-party blog (8 Sourced claims)                               | Select/Fetch | Verify               | `hoop.dev/blog/oauth-2-0-workflow-approvals-in-slack-...`                                                                         |
| 25       | gmail     | 6    | The gate matches the golden, but its only source is third party; 22 of 40 Sourced claims cite `unipile.com` | Verify       | none                 | `reviewGateTier: third_party`; labels ignore tier (`evidence/labelling.ts:29-40`)                                                 |

Passing cells (11): item 1 hubspot; item 2 gmail and notion; item 3 hubspot; item 5 github and microsoft; item 6 github, hubspot, microsoft, notion and slack.

Both stored guides you flagged reproduce on a fresh run: Gmail still cites the Contact Center page (7 claims, was 11), and Microsoft still cites B2C (8 claims, was 9) with `app.read` and `app.write`.

## 5. Root-cause categories, ranked

Counts are failing cells by the stage where the failure entered, out of 25. "Sourced claims exposed" counts claims that rest on a wrong, legacy or third-party page and trace to that stage.

| Rank | Stage            | Cells                                      | Sourced claims exposed | Apps                                  | Root cause                                                                                                                                                                                                                            | Where                                                           |
| ---- | ---------------- | ------------------------------------------ | ---------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| 1    | **Select/Fetch** | 11                                         | 124 of 188             | github, gmail, hubspot, notion, slack | Pages are chosen by tier, then Tavily's score, with no check that the page is about this product or answers the question. One slot is reserved for a non-official page whatever its relevance. Right pages sat in the results unread. | `fetch/select-pages.ts:37-61`, `search/order-results.ts:41-46`  |
| 2    | **Extract**      | 9                                          | 8 fake scopes          | all six                               | Prompts accept any string "exactly as written" as a scope, any "problem" as a blocker, and ask for "what it takes" as a milestone. Gate level is a model choice.                                                                      | `prompts/extract-sections.ts:15-19, 24-28, 29-31, 33-39, 49-52` |
| 3    | **Verify**       | 1 (and the missed guard in 13 other cells) | 150 pass as Sourced    | all six                               | A label depends only on quote found, conflict, and time estimate. Tier and product never matter. 18 quotes not found on their page were caught; 0 wrong-page claims were.                                                             | `evidence/labelling.ts:29-40`, `verify/verify-claims.ts:42-60`  |
| 4    | **Resolve**      | 2                                          | 17 (all of Slack's)    | slack                                 | An app has exactly one official domain. Docs split across two domains lose the better half.                                                                                                                                           | `resolve/decide.ts`, `search/jobs.ts:25-43`                     |
| 5    | **Plan**         | 2                                          | 9                      | microsoft                             | Queries carry only the app name plus generic words, so "Microsoft" finds B2C, Q&A and DevOps, never Graph.                                                                                                                            | `queries.ts:19-26, 43-60`                                       |
| 6    | **Score**        | 0 cells, 3 apps                            | n/a                    | hubspot, microsoft, slack             | A difficulty of 2 out of 5 is shown with the gate unknown; unknown facts count low.                                                                                                                                                   | `scoring/gate-facts.ts`, `scoring/difficulty.ts`                |
| 7    | **Budget**       | 0                                          | n/a                    | hubspot, microsoft, slack             | The one retry watches only steps and scopes, so unknown gate, wait or blockers never trigger it.                                                                                                                                      | `verify/missing-sections.ts:10`, `budget.ts:147-154`            |
| 8    | **Search**       | 0                                          | n/a                    | all six (enabler)                     | Searches are scoped to the whole company domain with no relevance floor; 41 of 147 official-tier results are not provider docs. Pool recall of golden pages: 12 of 32.                                                                | `search/jobs.ts:25-43`, `evidence/source-tier.ts:66-87`         |

**How the ranking was set.** By failing cells first, then by how many Sourced claims the stage exposes, then by whether it is the last line of defence.

**One note for the plan phase.** If "a confident wrong claim is the worst outcome" outranks coverage, Verify moves to the top: a relevance and tier guard turns the 150 bad Sourced claims into Uncertain without fixing retrieval, at the price of a higher Uncertain share. Select/Fetch and Verify should be planned together.

## 6. Hypotheses H1 to H7

**H1. Resolve or plan anchors on the wrong product family. Confirmed, with the stage corrected.**
Resolve is fine for Gmail and Microsoft: it returns the right company domain. The wrong family enters at Plan and Search: the queries are `Microsoft OAuth app setup client ID secret`, `Gmail OAuth app review approval process`, with no product anchor, and every search is scoped to the whole domain. It happened in 4 of 6 apps: GitHub to Actions, Gmail to Contact Center AI, Microsoft to B2C and DevOps, Notion to Snowflake. The one true Resolve failure is Slack (#5).

**H2. "Official" is decided by domain only. Confirmed.**
`sourceTier` looks at the host and nothing else (`evidence/source-tier.ts:66-87`). 41 of 147 official-tier search results are not provider documentation: 11 of Microsoft's 29 are Microsoft Q&A questions, 16 of GitHub's 32 are discussions, issues and strangers' repos (one stranger's repo and `octokit/auth-oauth-app.js` were fetched), and Notion has the same Snowflake article in three languages. 111 of 188 Sourced claims (59%) cite an official-tier page that is the wrong product or legacy.

**H3. Page selection accepts off-topic pages. Confirmed; the exact stored case did not reproduce, the mechanism did.**
Selection never asks whether a page is relevant (`select-pages.ts:37-61`). Of the golden pages that were in the results, 11 of 12 were not fetched; the Actions limits page, the Contact Center page and the Snowflake article were. Every run reserved one slot for a non-official page (a YouTube video, `unipile.com`, `apievangelist.com`, `o365hq.com`, `notionapps.com`, `hoop.dev`); `unipile.com` alone supports 22 of Gmail's 40 Sourced claims, and `hoop.dev` supplies Slack's top blocker. The Airlock security blog from the stored Microsoft guide did not recur, but a consulting page took its place (its production wait reads "The fixed-price project for a Microsoft Entra tenant is delivered in one week").

**H4. Extraction turns tutorial examples into scopes. Confirmed.**
Microsoft reproduces it exactly: `app.read` and `app.write` from "(for example, app.read and app.write)" on the B2C page. Three further variants: a host written as a scope by a third-party blog (Gmail `mail.google.com`), another product's scopes (Notion `session:role:`), and legacy scopes (Slack `chat:write:user`). 8 fake and 9 unlisted scopes across the run. The prompt asks for names "exactly as written" and nothing ties them to a scope reference (`extract-sections.ts:15-19`).

**H5. Milestone fields hold prose. Confirmed.**
24 fields: 0 durations, 9 Unknown, 15 prose. The effort fields are sentences by design (`extract-sections.ts:29-31`). The wait fields are prose when anything is found: Gmail's reads "typically takes 2-4 weeks, while restricted scopes ... take 4-12+ weeks" from a third-party blog, against Google's official 10 business days and 6 weeks. The wait is labelled Uncertain, but the figure shown contradicts the provider.

**H6. The run stops too early, or the page budget is too small. Partly confirmed; the budget is not the cause.**
Confirmed: runs end at 24 to 38 s (20 to 32% of 120 s), 5 of 6 hold 4 pages (`budget.ts:147-154`), and only GitHub retried (`missing-sections.ts:10` watches only steps and scopes), so unknown gate, wait and blockers in HubSpot, Microsoft and Slack triggered nothing. Rejected as the fix: fetching takes 0.8 to 2.9 s while extraction takes 10 to 26 s, but GitHub's retry spent two more fetches on an unrelated repo and a GraphQL page and still found no scopes. More pages help only after selection is fixed. **No budget change is supported by this data.**

**H7. Verify checks a quote exists, not that the page is relevant. Confirmed.**
`labelClaim` decides on quote found, conflict, and time estimate only (`evidence/labelling.ts:29-40`); the tier is stored as metadata and never read. 18 claims were downgraded for a missing quote, which shows the guard works against fabricated text. 150 Sourced claims on wrong, legacy or third-party pages were not touched, including 64 claims quoting the Snowflake article verbatim. The conflicts section found nothing in all six runs because the official page that contradicts the blog was never read.

## 7. Confirmed beyond the scorer, and corrections to its numbers

The scorecard counts only what the approved golden set lists. Three pages were confirmed by fetching them:

| Page                                                    | What it is                                                                                | Effect                                                                                       |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `notion.com/*/help/set-up-the-snowflake-mcp-for-notion` | "Learn how to connect Snowflake to a Custom Agent or your Notion Agent"                   | Wrong product: 64 claims, 2 scopes, the top blocker. Scorer shows 0 wrong-product for Notion |
| `devblogs.microsoft.com/devops/...scopes...`            | Azure DevOps OAuth scopes                                                                 | Wrong product: 1 claim (`user_impersonation`)                                                |
| `api.slack.com/docs/oauth`, `.../oauth-scopes`          | Redirect to `docs.slack.dev/legacy/legacy-authentication/` and `.../legacy-oauth-scopes/` | Legacy generation: 17 claims                                                                 |

Wrong-product pages: **5 distinct (scorer 3)**, plus 2 legacy. Top blocker: Notion is a fail, not "manual".

Proposed golden additions, **not applied** because the golden set is yours to approve: Notion hard avoid `notion.com` help articles under `/help/set-up-`; Microsoft hard avoid `devblogs.microsoft.com/devops`; Slack hard avoid `docs.slack.dev/legacy` and `api.slack.com/docs/oauth`.

## 8. What this baseline cannot tell us

- **One run per app.** LLM and search results vary run to run. The two stored guides corroborate the failure classes, but not the counts. A second run would put a number on the variance.
- **Gate evidence is not captured.** The harness records the tier of the page behind each gate fact, not the quote or URL. #6 is argued from the held pages and the guide's own text. Fix in the next harness commit.
- **Golden recall is conservative.** "12 of 32 in the pool" counts only the exact pages the golden set cites; other good pages exist. Slack's two matches are counted under the old host `api.slack.com`, which redirects to the golden `docs.slack.dev` URLs (checked); the agent never sees `docs.slack.dev` itself.
- **Heuristics in my counting.** "Not provider docs" is a path pattern (Q&A, discussions, issues, repos, blogs, help, trust); a few `.default`, `user_impersonation` and `mail.google.com` strings are real in other contexts and were counted fake because they are not usable scopes here.
- **The scorer's `thirdParty` list also holds official pages on a second host** (`devblogs.microsoft.com`, `slack.com/blog`, `notion.com/help`); read those lines by hand.
- **Holdout was not run and not looked at.**
