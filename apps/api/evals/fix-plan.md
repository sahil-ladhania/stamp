# Fix plan: five stages, in dependency order

Plan only. Nothing here is built. It follows [diagnosis.md](./diagnosis.md), which is the baseline every number below is measured against.

## 0. What I need from you

| #   | Decision                                                                                                                                                                 | Why it needs you                                                                | My recommendation                                                                                                                              |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | Revise design decision D7 ("a model checking a model can agree with a hallucination") so a model may judge whether a quote supports a claim                              | `docs/design-decisions.md` D7 rejects model checks. Stage 3 reverses part of it | Yes, with one rule that keeps D7's safety: **the model can only downgrade a claim, never upgrade it**                                          |
| A2  | One new AI model call in the verify stage (one batched fast-model call per run)                                                                                          | AGENTS.md: ask before adding a model call to the graph. No new stage or edge    | Yes                                                                                                                                            |
| A3  | Add three values to `DowngradeReason` in `@stamp/schema` (`off_product`, `not_supported`, `third_party_only`)                                                            | Schema change; the web app maps these in two files                              | Yes. Additive, no database migration                                                                                                           |
| A4  | Milestone effort and wait become durations or Unknown, so the "what it takes" prose leaves the milestones                                                                | Changes what the timeline shows. The steps section already carries the prose    | Yes. No schema change (Stage 4, option A)                                                                                                      |
| A5  | Show "Not rated" instead of a number when the review gate is unverified                                                                                                  | Web change in 5 components                                                      | Yes. No schema or database change (Stage 5, option 1)                                                                                          |
| A6  | How `--repeat 3` meets "at most 12 runs per batch"                                                                                                                       | 6 apps x 3 repeats = 18 runs                                                    | A batch is one repetition (6 runs). Up to 3 repetitions per command. One estimate and one `--confirm` cover all of them. Holdout never repeats |
| A7  | Cost: the whole programme is about **$24** (about $21 without the optional pages 4 vs 6 comparison; up to double if runs cost double), each batch still confirmed by you | Section 1                                                                       | Approve per batch, as now                                                                                                                      |
| A8  | Open the PR for `eval/harness` (3 commits, not pushed) so it can merge before PR 1                                                                                       | Every stage branches from `main` after the previous merge                       | Yes                                                                                                                                            |

**Approved on 2026-10-29, all eight decisions, with four notes that bind the work:**

1. **A1.** The revision is recorded as a **new decision** (the next free number after D23), not as an edit of D7. Its rule, in its own words: _a model may only downgrade a label, never upgrade it._ D7 gets a one-line pointer to it. Done in PR 4.
2. **A3.** Each new `DowngradeReason` gets its copy on the **live run page** (`apps/web/src/utils/downgrade-reason.ts` and `run-groups.ts`), in the same PR as the schema values. Done in PR 4.
3. **A4.** The timeline links each milestone to the relevant Steps, so removing the effort prose loses no context. PR 5 adds a test that every milestone still links to a step.
4. **A2.** PR 4 reports what the verify model call adds, measured from the stage's `--repeat 1` run against the clean baseline's mean: stage time, tokens and dollars per run, before and after.

No stage adds a dependency or touches `prisma/schema.prisma`.

## 1. Order, PRs and cost

Each PR branches from `main` after the previous one merges. I do not merge.

| PR  | Branch                      | What                                                                                             | Depends on                               |
| --- | --------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------- |
| 0   | `eval/harness` (done)       | Harness, golden set, diagnosis, scorer fix                                                       | none                                     |
| 1   | `eval/harness-v2`           | Capture gate evidence and search results, `--repeat`, `rescore`, retrieval and precision metrics | 0                                        |
| 2   | `fix/reliability-identity`  | Resolve and Plan                                                                                 | 1                                        |
| 3   | `fix/reliability-selection` | Search and Select/Fetch                                                                          | 2 (uses the identity)                    |
| 4   | `fix/reliability-trust`     | Verify                                                                                           | 2 (page-about-product check)             |
| 5   | `fix/reliability-shape`     | Extract                                                                                          | 4 (the judge adjudicates example scopes) |
| 6   | `fix/reliability-score`     | Score and the web "Not rated" state                                                              | 5 (needs reliable gate facts)            |
| 7   | `eval/model-experiment`     | Model comparison, then holdout once, docs                                                        | 6                                        |

Why this order: selection needs to know the product's identity; the trust checks need the same identity and work best on better pages; extraction shape fixes lean on the trust judge; the score is only as good as the gate facts under it.

**Cost, after the credit rule of 2026-10-29** (stage evals use `--repeat 1`; `--repeat 3` only for the clean baseline and the final comparison). One batch of 6 is about $1.04 and 60 credits; Tavily is about 46% of the dollars and all of the credits.

| Item                                                             | Batches of 6 | Dollars                                          | Credits                     |
| ---------------------------------------------------------------- | ------------ | ------------------------------------------------ | --------------------------- |
| Spent: first baseline, one run per app                           | 1            | $1.04                                            | 60                          |
| Spent: clean baseline, `--repeat 3`                              | 3            | $3.15                                            | 184                         |
| **Used by evals so far**                                         |              | **$4.19**                                        | **244**                     |
| After each of stages 2 to 6, `--repeat 1`                        | 5            | about $5.2                                       | about 305                   |
| Search fixtures for tests                                        |              | about $0.12                                      | about 15                    |
| Final comparison, `--repeat 3`: current models and the new model | 6            | about $4.7                                       | about 366                   |
| Holdout, once, 4 apps                                            | 0.67         | about $0.7                                       | about 41                    |
| Optional: first-pass pages 4 vs 6, `--repeat 1`                  | 1            | about $1.0                                       | about 61                    |
| **Still to spend** (without the optional item)                   |              | **about $10.7**                                  | **about 727**               |
| **Programme total**                                              |              | **about $15 (about $16 with the optional item)** | **about 971 (about 1,033)** |

**Read the credits column against your Tavily plan.** Tavily's free tier is 1,000 credits a month (its credits page says so). If that is your plan, the programme as written uses nearly all of it and leaves almost nothing for the live demo. Ways to cut it, your call: run the final comparison with `--repeat 2` (saves about 120), skip the optional item, spread the batches across two billing months, or move to a paid tier. Each batch still prints the credits used so far and the running total before it asks for your confirmation.

Stage 3's judge adds about $0.003 a run, which is inside the noise.

## 2. How every stage is judged

- **`--repeat 1` for each stage's eval, `--repeat 3` for the clean baseline and the final comparison** (the credit rule). A single run varies: the clean baseline shows contradictions from 21 to 60, the share of claims on good pages from 34% to 60%, and 5 of 24 verdicts changing between repetitions. So a stage's single run is read **against the baseline's range, not its mean**; a change smaller than the range is not a result. Effects that code makes deterministic (milestone durations, fake scopes, wrong-product claims labelled Sourced) are judged as pass or fail instead.
- **A stage passes** when its target metrics move as predicted in the mean, the zero-targets (wrong-product pages, fake scopes) hold in **every** repeat, and no guard metric regresses: p95 time at most 100 s, cost per run within 25%, and no per-app verdict that flipped from correct to wrong.
- **Every target below is my estimate, set before building.** If a stage misses its targets, the PR says so and says why; I do not move the target.
- **The PR description** carries the before and after table (mean and range) against the rescored baseline.
- **Tests first**, from fixtures built out of the tuning baseline only. Holdout inputs are never used to build a fixture.
- **No app-specific code**, ever. A small data file of hints is allowed only if the holdout set passes without new entries, and I will say so in the PR.
- **Labels stay set by code.** Prompts stay in `prompts/`, versioned, with tests.
- **Docs** (`docs/agent-architecture.md`, `docs/design-decisions.md`) are updated in the same PR as the behaviour.

## 3. PR 1: harness v2 (own small PR)

| Item                                                                                                                             | Why                                                                                                         | Size   |
| -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------ |
| Capture the gate evidence: quote, URL and tier for the review gate and the approval wait                                         | Finding 6 (GitHub's gate) could only be argued from held pages. Now it can be read                          | small  |
| Capture every search result with title, score and the query topic that returned it, and the resolve hits                         | The Stage 1 and 2 fixtures come from here; the baseline kept only URL and tier                              | small  |
| `--repeat N` (at most 3), mean and range per metric, and a flip count                                                            | Variance. See A6 for the batch rule. Holdout rejects `--repeat`                                             | medium |
| `eval:rescore <runDir>`                                                                                                          | Re-score saved runs when the golden set or scorer changes. I did this with a throwaway script twice already | small  |
| Two metrics: **Sourced claims on good pages** (baseline 20%) and **golden pages in results / fetched** (baseline 12 and 1 of 32) | They measure Stages 2 and 3 directly; Uncertain share cannot                                                | small  |

Tests: each new scoring function, `--repeat` aggregation, rescore round trip. No agent behaviour changes.

## 4. Stage 1: Identity (Resolve + Plan), PR 2

**Root cause.** An app has one official domain and no product identity.

- `nodes/resolve.ts:19-23, 58-59` and `resolve/decide.ts`: the one search is `<name> API developer documentation`, hits are grouped by domain, and one domain wins. Slack: `slack.com` 5.14 beat `slack.dev` 4.70, both exact brand matches, so `docs.slack.dev` was never searched and 17 claims came from legacy pages.
- `state.ts` `AppIdentity` is `{appName, domain, slug}`. Nothing says which product of the company is meant.
- `queries.ts:19-26, 43-60` and `prompts/plan.ts:24-25`: queries hold only the app name plus generic words, and the prompt forbids product names. Microsoft's pool held none of its 7 golden pages.

**Options.**

1. _Derive the identity from the resolve hits (code), validate it, let the planner use it._ Official domains: every domain whose brand label matches and that has docs-looking hits (Slack gets both). Product phrase: the longest 1 to 4 word phrase containing the app name that appears in at least 2 of the top official hit titles ("Gmail API", "Microsoft Graph"); null if none. Docs roots: the host plus the first two path segments shared by at least 2 hits. The plan prompt receives the phrase as data and must use it; code rejects queries without it or the name.
2. _Let the model name the product_ from its own knowledge. Rejected: it breaks "never invent a provider fact", and a wrong guess poisons every query.
3. _Ask "Did you mean" at product level_ ("Microsoft Graph or Azure DevOps?"). More correct, but it changes the live-demo flow for every large vendor.

**Pick: option 1**, plus one small change to the resolve query (add the word OAuth) so large vendors rank identity pages first. Option 3 stays out; I will note it as a follow-up if the holdout shows an unresolved product.

**Details to hold.**

- `sourceTier(url, domain)` becomes `sourceTier(url, domains)`; the probe stays on the **primary** domain only (`probe/target.ts`), so a second docs domain does not widen the SSRF guard.
- A typed domain or URL (`resolve.ts:27-32`) still means exactly that domain; product null.
- `Guide.domain` stays the primary domain, so no schema change.

**Expected change** (this stage alone; most gains need Stages 2 and 3):

| Metric                                | Baseline | Target                           |
| ------------------------------------- | -------- | -------------------------------- |
| Golden pages in the results           | 12 of 32 | at least 20 of 32                |
| Microsoft golden pages in the results | 0 of 7   | at least 4 of 7                  |
| Slack claims on legacy pages          | 17       | 0                                |
| Wrong-product pages cited             | 5        | at most 3 (selection is Stage 2) |

**Overfitting risk.** The phrase rule could suit the six tuning apps by accident. Guard: it is plain string logic with no vendor names; fixtures come from the tuning apps only; the holdout run is the test. If the phrase is null, behaviour falls back to today's.

**Tests.** Resolve and decide tests on captured hits for the six tuning apps (one capture, about 10 credits); title phrase extraction including the null case; plan query validation (phrase or name required, injection text inert); tier with several domains; the probe still refuses a second domain.

**Schema.** None. `AppIdentity` is internal to the API.

## 5. Stage 2: Selection (Search + Select/Fetch), PR 3

**Root cause.** Pages are chosen by tier and score, with no check that they answer the question.

- `fetch/select-pages.ts:37-61`: official first, then Tavily's score, plus a reserved non-official slot with no relevance test. `search/order-results.ts:41-46` sorts the same way; `:26-29` removes only identical URLs, so `docs.github.com/en/apps/...`, `docs.github.com/apps/...` and `developer.github.com/...` all count, and the Snowflake article in three locales was 3 of the 19 official results.
- `search/jobs.ts:25-43`: every query is scoped to the whole company domain.
- `verify/missing-sections.ts:10` and `budget.ts:147-154`: the one retry watches only steps and scopes, so an unknown gate, wait or blocker triggers nothing.

Evidence: 11 of 25 failing cells; 124 Sourced claims exposed; 11 of the 12 golden pages that were in the results went unread.

**Options.**

1. _Deterministic, topic-aware relevance._ Canonicalise URLs (locale segments, `hl`-style parameters). Remember which topic's query returned each result. Score each result on: match with the identity's docs roots and product phrase, OAuth words in the title, a soft penalty for community, discussion, issue, blog and help paths, a penalty for "legacy" or "deprecated" in the title, and Tavily's score as a tiebreak. Pick the best page for each topic first (setup, scopes, review, wait, limits, auth), then fill. Keep the non-official slot only for a result that passes the relevance floor, and mark it. Extend the retry to unknown review gate and blockers.
2. _Model re-rank:_ one fast-model call over titles and snippets. Likely better at relevance, but a second model call in the graph, and it needs your approval. Reserve it: use it only if option 1 does not reach the targets.
3. _Read more pages_ (first pass 6, not 4). Cheap (+1 to 2 s, at most +1 credit), but it feeds more noise to Extract's fixed 14,000-character excerpts.

**Pick: option 1.** Option 3 is tested, not assumed: `AGENT_FIRST_PASS_PAGES` (env, 4 to 6, default 4) and one extra `--repeat 1` batch. **I change the budget only if that comparison shows a gain** (your rule).

**The path penalty must be soft.** Gmail's verification FAQ is `support.google.com/cloud/answer/13463817`; an "answer" path rule that excluded it would remove a golden page. Hard exclusion stays limited to what is already `forum`. Any pattern list is a data file of generic web conventions (not vendor paths); I will state in the PR whether the holdout needed an entry.

**Expected change:**

| Metric                       | Baseline | Target                           |
| ---------------------------- | -------- | -------------------------------- |
| Golden pages fetched         | 1 of 32  | at least 14 of 32                |
| Sourced claims on good pages | 20%      | at least 60% (95% needs Stage 3) |
| Wrong-product pages cited    | 5        | at most 1                        |
| Review gate correct          | 2 of 6   | at least 4 of 6                  |
| Apps with 2+ real scopes     | 3 of 6   | at least 5 of 6                  |
| Contradictions               | 103      | at most 15                       |

**Overfitting risk.** The weights could be tuned to the six apps. Guard: few features with round weights, set once from the baseline, no re-tuning after seeing a repeat; a leave-one-out check (set the weights without app X, test on X) reported in the PR; holdout at the end.

**Tests.** Selection on the six saved result lists (needs PR 1's capture) asserting the golden pages are picked and the five wrong pages are not; canonicalisation table; topic coverage; the reserved slot passes only past the floor; retry trigger on unknown gate; allowance edge cases.

**Schema.** None. `SearchResult` gains a `topics` field, and it is an internal type.

## 6. Stage 3: Trust (Verify), PR 4

**Root cause.** A claim is Sourced if its quote appears on the page. Nothing else counts.

- `evidence/labelling.ts:29-40`: the label depends on quote found, conflict and time estimate only. `verify/verify-claims.ts:42-60` stores the page's tier as metadata and never reads it.
- Result: 150 of 188 Sourced claims rest on a wrong-product, legacy or third-party page and passed; 18 missing quotes were caught.

**Design: code sets the label; the model can only take it away.**

| Check                                                                                                | By                                                                                                                             | Effect                                                                   | Reason code              |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ | ------------------------ |
| Quote found, conflict, time estimate                                                                 | code (unchanged)                                                                                                               | Uncertain                                                                | existing                 |
| Page is about this product: under the identity's docs roots, or its title carries the product phrase | code                                                                                                                           | claim becomes the unknown placeholder, source dropped                    | `off_product` (new)      |
| Page is "legacy" or "deprecated" in its title                                                        | code                                                                                                                           | Uncertain                                                                | `stale_source` (exists)  |
| Key fact (review gate, wait, scope names) has no official, on-product source                         | code                                                                                                                           | Uncertain; a gate or wait with only third-party evidence becomes unknown | `third_party_only` (new) |
| Numbers, scope names and gate words in the claim appear in the quote                                 | code                                                                                                                           | Uncertain if not                                                         | `not_supported` (new)    |
| The quote states what the claim says                                                                 | **model**, one batched fast call per run, inputs are claim text and quote only, answers `supported`, `partly` or `unsupported` | `partly` and `unsupported` give Uncertain                                | `not_supported`          |

The judge runs only on claims that already passed every code check, so it **cannot create** a Sourced claim. If it fails twice, labels stay as the code set them, the guide is marked partial and the run summary says the check was skipped. The alternative (fail closed) would turn a transient outage into an all-Uncertain guide and a failed save; I recommend fail-open and loud, but it is your call.

**Options for the support check.**

1. _Code only_ (overlap of numbers, names and keywords). Deterministic, but it misses a quote on the right page that says something else, like the HubSpot "no major blockers" claim.
2. _Model only._ Catches paraphrase, but one error becomes a wrong label with nothing behind it.
3. _Both, in order (the table above)._ Code first, then the model, which can only remove. **Pick.**

**Budget.** Verify's cap rises from 2 s to about 8 s (4 s on retry). To keep the caps inside 120 s I lower extract's first-pass cap from 40 to 34 s (observed 10 to 26 s). `docs/agent-architecture.md` section 6 changes with it.

**Prompt safety.** The judge sees only the claim and the quote, inside per-call delimiters, answers from a fixed list, and the prompt says the text is data. Tests include an injection quote.

**Expected change:**

| Metric                                               | Baseline                | Target                                                    |
| ---------------------------------------------------- | ----------------------- | --------------------------------------------------------- |
| Sourced claims on wrong, legacy or third-party pages | 150                     | at most 5                                                 |
| Wrong-product claims labelled Sourced                | 94                      | 0                                                         |
| Sourced claims that contradict the golden set        | 103                     | at most 5                                                 |
| Third-party-only key fact marked Sourced             | 1 (Gmail's gate)        | 0                                                         |
| Sourced claims on good pages                         | 20% (60% after Stage 3) | at least 95%                                              |
| Uncertain share                                      | 34%                     | rises, reported (my guess 45 to 60% on today's retrieval) |

A higher Uncertain share is the intended price: it is the honest answer when the right page was not read.

**Overfitting risk.** The judge is a model, so it varies. Guards: the result is read against the baseline's range, since a stage runs once; a labelled set of about 60 baseline claims (supported, partly, unsupported) that the judge must score at least 90% on, **which you spot-check** (a sample of 20); the code checks carry most of the weight and are deterministic; holdout at the end.

**Tests.** Table tests for the whole decision matrix; the judge with a fake model (outage, bad JSON, injection, "partly"); the tier rule on gates and scopes; a regression test that the 94 wrong-product claims from the baseline all fall out; web mapping for the three new reasons.

**Schema.** `DowngradeReason` in `packages/schema/src/enums.ts` gets three values (A3). `apps/web/src/utils/downgrade-reason.ts` and `run-groups.ts` get copy for them. No database change: reasons are stored in the log's detail, not in a Prisma enum.

## 7. Stage 4: Shape (Extract), PR 5

**Root cause.** The prompts accept anything of the right shape.

- `prompts/extract-sections.ts:15-19` (scopes: "exactly as written"), `:24-28` (blockers: "problems that stop or delay"), `:29-31` (milestones: "what it takes"), `:33-39` (gates), `:49-52` (the model picks the top blocker by index; `guide/assemble-sections.ts:130-140`).
- Result: 9 cells; 8 fake scopes; 0 of 24 durations; GitHub's gate; Gmail with no top blocker; Notion's top blocker an `invalid_client` error.

**Durations (milestones).**

- A. _Structured output, code writes the text._ The milestones call returns minimum and maximum days (as the gates call already does), code checks the numbers appear in the quote (digits or number words), and writes "3 to 7 days" or the unknown text. The time-estimate rule still makes it Uncertain. **Pick.** No schema change.
- B. _Keep free text and reject whatever fails a regex._ Keeps the model's prose and wastes the fixable cases.
- C. _Add a `duration` object to `Claim` in `@stamp/schema`._ Cleanest data, but a shared-schema change that touches the web app and every guide. Not justified yet; I would ask first.

Effort becomes "time to complete the step", which docs rarely state, so most effort fields will honestly be Unknown (A4). The web timeline chips already parse durations from text (`utils/milestone-durations.ts`), so they keep working.

**Scopes.** Prompt: a scope is a string the provider defines for an app to request; not a role, a header, an example or a placeholder. Code validators (generic): the name appears verbatim in the quote; a single token (multi-word capability names, like Notion's, stay allowed only on an official page); no placeholder words. A name sitting in example context ("for example", "e.g.", "such as") goes to Stage 3's judge, which keeps it only if the quote presents it as a real provider scope. That keeps HubSpot's real `crm.objects.contacts.read` ("e.g., ... to retrieve contacts") and drops Microsoft's `app.read` ("for example, app.read and app.write").

**Blockers and the top blocker.** Each blocker gets an internal `kind`: approval, setup, limit or error (an error a coder sees, like `invalid_client`). **Code** picks the top blocker: highest kind (approval, then setup, then limit; never error), official source first. If none qualifies there is no top blocker, honestly. This removes the model's index pick.

**Gates.** The prompt says a review gate is a review _by the provider_ of the developer's app; a customer's admin approving an app is not a gate (GitHub). Code: a gate other than none or unknown needs a review, approval, assessment, listing or vetting word in its quote.

**Verdict.** The prompt forbids stating that something is absent; Stage 3's judge removes whatever slips through.

**Expected change:**

| Metric                                         | Baseline                 | Target                   |
| ---------------------------------------------- | ------------------------ | ------------------------ |
| Milestone fields that are durations or Unknown | 9 of 24                  | 24 of 24                 |
| Fake or tutorial scopes                        | 8                        | 0                        |
| Apps with 2+ real scopes                       | 3 of 6 (5 after Stage 3) | at least 5 of 6          |
| Top blocker is a setup or approval blocker     | 2 of 6                   | at least 5 of 6          |
| GitHub gate                                    | wrong                    | none or optional_listing |

**Overfitting risk.** The example-context phrases and the blocker kinds are general English and OAuth vocabulary, not vendor words. Guard: validators tested on real baseline quotes, then the holdout.

**Tests.** Validators on the actual baseline quotes (the `app.read` example, the Snowflake `session:role:`, the `mail.google.com` host); the duration writer ("two weeks", "10 business days", ranges, a number absent from the quote); top-blocker choice table; gate vocabulary check; prompt snapshot tests.

**Schema.** None under the pick. Option C would be the only schema change in the plan.

## 8. Stage 5: Score, PR 6

**Root cause.** Unknown facts score low, and the guide still shows a number.

- `scoring/difficulty.ts` (gate unknown is 0 points; an unknown wait counts 2) and `scoring/archetype.ts:14-35`. HubSpot, Microsoft and Slack came out at 2 of 5 with the gate unknown.
- The web app always draws a number (`StampMark.tsx:37`, `DifficultyDots`, `LibraryCard`, `AppCard`, `LibraryTableRow`). `archetype: unknown` is stored, but nothing hides the score.
- GitHub shows `hidden_limits` on a gate that was wrong; with an unknown gate, hidden limits would show too.

**Options.**

1. _No stored change._ An unverified gate always gives the archetype `unknown` (a one-line order change in `classifyArchetype`). The web app shows "Not rated" with the breakdown "so far" whenever the archetype is unknown. **Pick.** The stored `difficulty` stays as a lower bound for sorting.
2. _A new field_ (`difficultyIsLowerBound`) in `@stamp/schema`. The clearest contract, but a shared-schema change. I would ask first.
3. _Make `difficulty` nullable._ Needs a schema and a database migration (`guides.difficulty` is a non-null column with an index). Not worth it.

**Expected change.** Confident difficulty with the gate unknown: 3 apps to 0. Everything else is unchanged by this stage; its value rises as Stages 2 to 4 reduce unknown gates.

**Overfitting risk.** None to speak of; the rule is the one the docs already state ("the score is a lower bound").

**Tests.** Archetype table for every gate and fact; web tests for "Not rated" in each component; a library sort check.

**Schema.** None under the pick (A5 covers the web change).

## 9. PR 7: model experiment, then holdout once

**Facts** (from OpenAI's pages, checked today): both `gpt-4.1` and `gpt-4.1-mini` shut down on 2027-01-14; the recommended replacement for both is `gpt-6-luna` at $0.10 in and $0.50 out per 1M tokens (16 to 20 times cheaper than `gpt-4.1`), a reasoning model with structured outputs and `reasoning.effort` from `none` to `max` (default `medium`).

**Two things must change first**, which is why this is a PR and not a flag:

- `lib/openai-params.ts` recognises reasoning models with `/^(o\d|gpt-5)/`, so `gpt-6-luna` would be sent a temperature it may reject. The rule needs a capability check or a wider pattern.
- Reasoning tokens bill as output and add latency. I would test `reasoning_effort` at `none` and at the default and report both.

**Design.** The models are environment variables, so no new flag: `OPENAI_MODEL_FAST=gpt-6-luna OPENAI_MODEL_STRONG=gpt-6-luna pnpm --filter api eval -- --set tuning --repeat 3 --confirm`. Control is the final code with the current models, and treatment is the same code with the new model on both tiers, each at `--repeat 3`: a single stage run cannot be compared with a three-repetition mean. I add the price to `pricing.json` with its source quote.

**Decision rule, set before I look:** the new model wins if the correctness metrics are within noise (mean within the control's range) and p95 time and cost do not get worse. Otherwise stay on `gpt-4.1` and plan the migration as a follow-up (the shutdown is 77 days away).

**Then holdout, once**, with the winning configuration, `--allow-holdout`, no repeat, and no tuning afterwards. I report it as it comes, including if it is worse than tuning by more than your 10% bound.

**Closing deliverables:** `docs/verification-log.md`, the README sections "How we test reliability" and "Limitations".

## 10. Risks I cannot remove

- **Six apps is a small tuning set.** Holdout (4) is the only unbiased read, and it is used once.
- **The golden set has a human in it.** I added three entries after seeing a run; I said so in the files. Any further addition has to be flagged the same way.
- **Retrieval depends on a third party** (Tavily's ranking can change between runs). The clean baseline's `--repeat 3` shows the spread; it does not remove it.
- **Stage 3 trades coverage for honesty.** If the Uncertain share rises a lot before Stage 2 lands, the intermediate guides look thin. That is the correct failure.
- **Microsoft stays hard.** "Microsoft" names a dozen products. Stage 1 improves the odds; it does not resolve the ambiguity (option 3 in Stage 1).
