# PR 6b: coverage plan (plan only, nothing is built)

Goal: read more of the pages that hold the answer (review gate, scope names) without lowering any trust metric. Evidence below is from the **tuning** runs only (`evals/runs/2026-10-29T18-11-45Z` to `18-54-14Z`), plus three one-credit page fetches of Gmail's scopes page. The holdout result was not used to choose any item here (see section 5).

## 0. What I need from you

| #   | Decision                                         | Why it needs you                                                                                                                                        | My recommendation                                                                                  |
| --- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| C1  | Raise the page budget from 6 to 8                | `.cursor/rules/agent/graph-budgets.mdc` states "Max 120 seconds per run, 6 pages, 1 retry"; this changes a written rule                                 | Yes, to 8 (not 10 or 12: the gain flattens)                                                        |
| C2  | The Dropbox failure from the holdout (section 5) | Fixing it uses holdout information, so the holdout is spent                                                                                             | Report it as the generalisation gap; fix it in its own PR only if you accept a fresh holdout later |
| C3  | Budget for the stage eval                        | About 802 now (752 + 47 + 3 diagnostic credits); one eval is about 70 to 75, so about 877 against the 920 ceiling, with room for **no** second full run | One `--repeat 1` run; a targeted one-or-two-app check only if a guard fails                        |

## 1. The evidence

For each tuning app, the page the golden file cites for the **review gate**, and whether the search found it and the run read it (Stages 2 to 5, four runs):

| App       | Gate page found by the search                                 | Read  |
| --------- | ------------------------------------------------------------- | ----- |
| Notion    | 4 of 4 (`marketplace-listing`), 3 of 4 (`public-connections`) | never |
| Gmail     | 4 of 4 (`restricted-scope-verification`)                      | never |
| HubSpot   | 3 of 4 (`legacy-apps/public-apps/overview`)                   | never |
| Slack     | 1 of 3 pages, 3 of 4                                          | never |
| GitHub    | 0 of 2                                                        | n/a   |
| Microsoft | 0 of 1                                                        | n/a   |

So for three apps the answer is in the results and is not read; for two it is never found. Replaying the selection on the saved Notion, Gmail and HubSpot lists shows why:

- **Credit by tag, not by fit.** A page counts as covering every topic whose query returned it. Notion's `authorization` page covers "review" by tag, though its title is about setup, so the real review page (`List on the Marketplace`, rank 9) gets no coverage bonus.
- **Saturation.** Nine or ten pages tie at "title answers the topic" (fit 3), so the order among them is the search score. Gmail's gate page is rank 10 of 32 by 0.06; HubSpot's is rank 27 because its path and title say `legacy` (a real path name there, not a Slack-style legacy page).
- **Off-company pages take reading slots.** In the final run the non-official reserved slot read Figma's forum post "OAuth App Review Time" (for HubSpot) and Google Workspace Marketplace's app review page (for Notion); in the Stage 3 run it read Zoom's developer forum (for Notion). All pass the floor because their titles answer a topic; none names the app. The name guard below removes these. It does **not** cover official pages of another product of the same company: Gmail's final run read Google Cloud Contact Center and Workspace Marketplace pages (official tier) in 2 of its 6 slots, and no title or tier signal separates them from Gmail's own OAuth pages. That stays open.
- **Gmail scopes.** The scopes page's extracted text has no scope names (5,157 characters). The same URL fetched with Tavily's `markdown` format (same basic depth, same 1 credit) returns 7,736 characters that contain `https://www.googleapis.com/auth/gmail.labels` and the others. `advanced` depth with `text` format returned the same 5,157 characters as today.
- **The judge.** GitHub's drafted gate `none` was removed, and rightly: the golden pages for GitHub's gate are not in the results, so the quote was a page about organisation owners approving apps. Gmail's drafted `required_to_scale` (the golden file accepts it) was **kept in pass 1 and removed in pass 2 on the same evidence**, while pass 2 removed 11 items against 4 in pass 1. The judge runs at temperature 0, so the difference is the different item set in the batch, not randomness.

## 2. The three fixes

### 2.1 Gmail scopes (and other link tables): fetch pages as markdown

- **Change:** `extractPages` uses `format: "markdown"` instead of `"text"`, and a small code step rewrites links so the visible text keeps the address (`[x](x)` becomes `x`; `[label](url)` becomes `label (url)`). Quotes are still slices of the stored text, so the quote check is unchanged.
- **Expected:** Gmail's scope names appear in the text; the scope rules decide as before. Other apps with link-heavy tables benefit the same way.
- **Risks to trust:** more scope names means more chances for a fake one; the scope rules (single token, not a placeholder, not an admin page) still apply and the fake-scope guard below catches a regression. Pages are about 50% longer; the per-section excerpt is capped at 14,000 characters, so tokens should rise only for short pages. Pages cached in the last 7 days keep the old text until they expire (no trust effect: quotes are checked against the stored text).
- **Tests:** the link rewrite table; a markdown page through the passage selector; quote verification against rewritten text; the Gmail page fixture (one saved copy, tuning app only).

### 2.2 Gate pages: spend the slots better

1. **Page budget 6 to 8** (needs C1). Simulated on the saved lists: scope page read in 4 of 6 apps (from 3), golden pages picked 7 (from 6), gate pages unchanged. Tavily extract is 1 credit per 5 pages, so 8 pages cost no more than 6 (2 credits); about 1 to 2 s more in fetch, and no extra model tokens (the excerpt is capped).
2. **Name guard on the reserved slot:** a non-official page takes the slot only if its title or URL names the app. Simulated on the final run's lists: non-official pages that do not name the app 3 to 0, golden pages and wrong-product picks unchanged. This only removes reads, so it cannot lower a trust metric.
3. **Gate-first retry:** when the review gate is unknown after pass 1, the retry's first picks are the best unread official pages by gate vocabulary in the title or path (review, approval, verification, listing, marketplace, publish, public, distribution, submit), then the general pick. This is the only change that targets the gate pages directly; it is not simulatable on one-shot lists, so its test is a table on the saved lists plus the eval.

- **Rejected:** counting a topic as covered only when the page's title fits it (simulated: golden pages picked drops from 6 to 5); more than 8 pages (12 pages reach the gate page in 2 of 4 apps, at more fetch time); a new gate search query (changes retrieval for every app; not enough evidence).
- **Expected:** Notion's and Gmail's gate pages are read, so 1 to 2 more gates become verifiable. Honest ceiling: GitHub, Microsoft and Slack's gate pages are never in the results, and HubSpot's carries the legacy penalty; this plan does not fix retrieval.

### 2.3 The judge: make it consistent, not looser

- **Change:** keep a verdict for an unchanged (claim, quote) pair across the two verify passes, so a claim or gate judged in pass 1 is not re-judged differently in pass 2 (and the retry judges only new items, which also saves tokens). Log the items the judge removes (id, support, aboutProduct; no quote text) in the verify summary so its precision can be measured.
- **Not changed:** the prompt, and the rule that it can only remove a label. Loosening it is not supported by the evidence: both drops I traced were either right (GitHub) or an inconsistency (Gmail).
- **Tests:** a verdict is reused for an unchanged pair and re-asked for a changed one; the log line; the existing downgrade-only tests unchanged.

## 3. Guard rails: the stage must not lower any trust metric

One `--repeat 1` tuning run, read against the final Stage 5 run (`18-54-14Z`) and, for trust, against the baseline range. **The stage fails if any of these is worse**, whatever the gains:

| Guard                                          | Final Stage 5                  | Must hold             |
| ---------------------------------------------- | ------------------------------ | --------------------- |
| Wrong-product pages cited                      | 0                              | 0                     |
| Sourced claims that contradict the golden set  | 1 (`/.default`, fixed)         | 0 or 1                |
| Fake scopes                                    | 1                              | at most 1             |
| Wrong review gates                             | 0                              | 0                     |
| Milestone fields that are durations or Unknown | 24 of 24                       | 24 of 24              |
| Sourced claims on good pages                   | 85% (Gmail's third-party blog) | at least 85%          |
| p95 run time / within 120 s                    | 35.8 s / 6 of 6                | at most 60 s / 6 of 6 |
| Cost per run                                   | $0.21                          | at most $0.24         |
| Any app whose gate was correct                 | HubSpot, Slack                 | still correct         |

Coverage targets (reported, not guards): review gate correct at least 3 of 6 (now 2), apps with at least 2 real scopes at least 3 of 6 (now 2; Gmail is the case), top blocker at least 4 of 6 (now 4).

## 4. Order and cost

1. Name guard + judge consistency + the verify log line (smallest, trust-positive).
2. Markdown extraction + link rewrite.
3. Page budget 8 + gate-first retry (needs C1).
4. Docs: `docs/agent-architecture.md`, the page rule in `.cursor/rules/agent/graph-budgets.mdc`, the verification log.
   One eval at the end, about 70 to 75 credits. No schema, database, dependency or model-call change.

## 5. Not in this plan: the holdout's Dropbox failure

The one holdout run (`19-09-54Z`) had Dropbox resolve to `hellosign.com` (Dropbox Sign), whose page titles matched the name (score 4.08), above `dropbox.com`, whose brand label is exactly the name (3.97). The identity then took the product phrase "Dropbox Sign API" from that domain, and every page read was another product's. The tuning data has no case where a title-only domain competes with an exact-label domain, so it neither shows nor tests this. It is a resolve-stage problem, separate from coverage, and any fix to it is informed by holdout data, which spends the holdout. I recommend a separate decision (C2) and not folding it into 6b.
