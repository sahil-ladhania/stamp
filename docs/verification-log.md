# Verification log: how we know the guides are trustworthy

This is the record of the reliability work on Stamp's live guides (2026-10-29): what we measured, what we changed, what each change did to the numbers, what broke on the way, and what is still not good enough. It is written so a reviewer can check every claim against the saved runs, not trust it.

**The one rule behind all of it.** A confident wrong claim is worse than an honest Unknown. Every change was judged on that, not on how full the guide looked.

---

## 1. What "trustworthy" means here

The contract each guide has to meet (the brief left it empty, so this default was used):

1. A Sourced claim cites a page about this app's API, not another product's.
2. The review gate matches what the provider's official docs say.
3. Scopes are real strings from the provider's scope reference.
4. Milestone effort and wait are durations or Unknown, never prose.
5. The top blocker is a setup or approval blocker with an official source, or is clearly Uncertain.
6. A third party alone never decides a key field (review gate, wait, scope names) without being marked.
7. Every run ends, done or partial, inside 120 seconds.

## 2. How we measure it

- **Golden set** (`apps/api/evals/golden/`): 10 apps researched by hand from official pages, each fact with its URL and a verbatim quote, and at most two accepted values per field. Six apps are the **tuning set** (GitHub, Gmail, HubSpot, Microsoft, Notion, Slack), used to build and tune. Four are the **holdout** (Asana, Calendly, Dropbox, Zoom), run **once**, at the end, never tuned on and never used to build a test fixture.
- **Harness** (`apps/api/evals/`): runs the real agent on an app with no database writes and a fresh page fetch, captures every stage, and scores the guide against the golden file with code (no model judges the score). `--repeat N` reruns the batch and reports the mean and the lowest-to-highest range; `eval:rescore` scores saved runs again for free.
- **Cost control:** every batch prints its estimate and the credits used so far and runs only with `--confirm`; at most 12 runs a batch, 2 in parallel. Total Tavily use for the whole programme is below (721 credits in the ledger).
- **Read single runs against the baseline range, not its mean.** The clean baseline (three repetitions) shows how much one run varies: contradictions 21 to 60, claims on good pages 34% to 60%, and 5 of 24 verdicts changing between repetitions. A change smaller than that range is not a result.

Reproduce:

```bash
pnpm --filter api eval -- --set tuning                 # prints the estimate; nothing runs
pnpm --filter api eval -- --set tuning --repeat 1 --confirm
pnpm --filter api eval:rescore -- apps/api/evals/runs/<run folder>
```

## 3. Every batch we ran

Run folders are in `apps/api/evals/runs/` (git-ignored; they hold full traces). Credits are Tavily credits from the run ledger; the Tavily dashboard read about 25 higher.

| Folder (2026-10-29)                                                       | What it measured                                        | Runs   | Credits |
| ------------------------------------------------------------------------- | ------------------------------------------------------- | ------ | ------- |
| `14-39-20Z`                                                               | First baseline, one run per app                         | 6      | 60      |
| `17-23-52Z`                                                               | **Clean baseline**, `--repeat 3`, same code             | 18     | 184     |
| `17-53-33Z`                                                               | Stage 1, first try (with "OAuth" in the resolve query)  | 12     | 89      |
| `17-58-08Z`                                                               | Stage 1, after removing that word                       | 6      | 65      |
| `18-11-45Z`                                                               | Stage 2: selection                                      | 6      | 64      |
| `18-29-23Z`                                                               | Stage 3: trust checks and the support check             | 6      | 70      |
| `18-43-33Z`                                                               | Stage 4: shape                                          | 6      | 71      |
| `18-54-14Z`                                                               | Stage 5: score; the **final "after"** on the tuning set | 6      | 71      |
| `19-09-54Z`                                                               | **Holdout**, run once, at the end                       | 4      | 47      |
| **Total** (tuning 66 runs and 674 credits, holdout 4 runs and 47 credits) |                                                         | **70** | **721** |

## 4. The numbers, stage by stage

Tuning set, six apps. Baseline is the mean (lowest to highest) of the clean `--repeat 3`; each later column is one run.

| Metric                                                 | Target     | Baseline         | 1 Identity | 2 Selection | 3 Trust | 4 Shape | 5 Score (final) |
| ------------------------------------------------------ | ---------- | ---------------- | ---------- | ----------- | ------- | ------- | --------------- |
| Wrong-product pages cited                              | 0          | 4.3 (3 to 5)     | 3          | 1           | 0       | 0       | **0**           |
| Sourced claims that contradict the golden set          | 0          | 39.7 (21 to 60)  | 27         | 20          | 0       | 0       | **1**           |
| Sourced claims on good pages                           | 95%        | 43% (34% to 60%) | 58%        | 92%         | 99%     | 99%     | 85%             |
| Milestone fields that are durations or Unknown (of 24) | 24         | 10 (9 to 11)     | 11         | 12          | 12      | 24      | **24**          |
| Fake or tutorial scopes                                | 0          | 6.7 (5 to 10)    | 1          | 12          | 21      | 1       | **1**           |
| Review gate correct (of 6)                             | 5          | 2.3 (2 to 3)     | 1          | 3           | 1       | 1       | 2               |
| Wrong review gates (of 6)                              | 0          | 0 to 1           | 1          | 1           | 0       | 0       | **0**           |
| Apps with at least 2 real scopes                       | 5          | 2.7 (2 to 3)     | 1          | 3           | 2       | 2       | 2               |
| Top blocker is setup or approval (of 6)                | 5          | 3 (2 to 4)       | 1          | 3           | 4       | 4       | 4               |
| Golden pages read (of 32)                              | report     | 1.7              | 1          | 7           | 7       | 8       | 7               |
| Uncertain share                                        | report     | 32%              | 42%        | 31%         | 44%     | 40%     | 38%             |
| Runs within 120 s                                      | 100%       | 6 of 6           | 6 of 6     | 6 of 6      | 6 of 6  | 6 of 6  | **6 of 6**      |
| p95 run time                                           | 100 s      | 41.9 s           | 59.2 s     | 43.4 s      | 40.9 s  | 36.6 s  | **35.8 s**      |
| Cost per run                                           | within 25% | $0.17            | $0.18      | $0.18       | $0.19   | $0.20   | $0.21           |

**What this says.** The trust metrics, the ones that stop a confident wrong claim, moved from badly failing to met or all but met: wrong-product pages 4.3 to 0, contradictions 40 to 1, durations 10 of 24 to 24 of 24, fake scopes 6.7 to 1, and no confident wrong review gate. The coverage metrics, the ones that make a guide useful, did **not** reach their targets: review gate correct, scopes and top blocker stay inside or at the top of the baseline range. Stamp is much more careful; it is not yet more complete.

## 5. What each stage did, and what it taught us

1. **Identity (resolve and plan).** Each app now has every official domain (Slack's `slack.com` and `slack.dev`) and a product phrase read from official page titles ("Gmail API", "Microsoft Graph"). _Went wrong:_ adding the word "OAuth" to the resolve query made Gmail end `NO_PUBLIC_DOCS` in 2 of 2 runs (the hits were Google's generic OAuth pages, none titled "Gmail"). The eval caught it; the word was removed and a test pins the query.
2. **Selection (search and fetch).** Pages are chosen by how well their title and path answer each topic, one page per topic first, instead of by search score. Good-page share 58% to 92%; golden pages read 1 to 7. _Found:_ Slack's review gate was a confident wrong claim (a workspace admin approving apps, not Slack reviewing them).
3. **Trust (verify).** Code downgrades a Sourced claim on a legacy page, scope names from a non-official page, or numbers its quote lacks; the review gate and wait must come from an official page. One batched fast-model call (about 1.1 s, $0.002 a run) lists claims whose quote does not state them or whose page is about another product; **it can only remove a label, never add one** (decision D24). Wrong-product and contradictions went to 0, good pages to 99%. _Price:_ the Uncertain share rose to 44% and review gate correct fell, because wrong gates became unknown. _Found:_ a gap in Stage 2's retry: an unknown gate triggered a search, but extraction never redid the gates.
4. **Shape (extract).** Code writes milestone durations from the number in the quote, keeps a scope only if the fetched page holds the name and it is not a placeholder, half name, bare host, URL fragment or admin-page name, chooses the top blocker (approval, then setup, then limit, never an error message), and requires review vocabulary behind a gate. Durations 24 of 24. _Went wrong:_ my first scope rule ("the quote must contain the name") dropped Gmail's scopes; relaxing it to the page text did not bring them back, because Gmail's scope names are not in the extracted page text at all (see limits below).
5. **Score.** An unknown review gate now gives the archetype `unknown` and the web app shows "Not rated" instead of a number (decision D25).

## 6. Known problems that are still open

- **The review gate is unknown for 4 of 6 tuning apps.** Where it is lost differs (the `reviewGate` line in the verify summary log shows it per run): no page read states one (Microsoft, Notion); the support check removed a drafted gate whose quote did not state it (GitHub, Gmail). Notion's gate was correct and officially sourced in the baseline and has been unknown in every run since Stage 1, because the page that states it is found but not among the six pages read.
- **Gmail's scopes are Unknown.** The scopes page's extracted text does not contain the scope names. The old pipeline let the model write them from memory with the description as the "quote"; that is now rejected.
- **85% of Sourced claims on good pages in the final run**, below the 95% target, because 23 of Gmail's claims cite one third-party blog. They are marked third-party on the page; by design third-party pages stay allowed for non-key claims.
- **Only one run per stage.** Each stage was judged on a single run read against the baseline range, because of the credit budget. The stage numbers in section 4 are therefore indicative; only the baseline has a measured spread.
- **The support check is a model.** It can wrongly remove a good claim. That costs coverage, never trust; it was not measured against a labelled set (the 90% accuracy target in the plan was not built).
- **Cost per run rose 20%** ($0.17 to $0.21): the retry now fires on every run, re-extracts the gates, and the support check adds a call.

## 7. Holdout

The holdout is Asana, Calendly, Dropbox and Zoom, run **once** (`19-09-54Z`, 47 credits, $0.80) with the final code of all five stages and no tuning on the result. It is the honest generalisation number, and it is worse than the tuning set.

| Metric                                         | Target          | Holdout (4 apps)             | Tuning final (6 apps) |
| ---------------------------------------------- | --------------- | ---------------------------- | --------------------- |
| Wrong-product pages cited                      | 0               | **3** (all Dropbox)          | 0                     |
| Sourced claims that contradict the golden set  | 0               | **30** (Dropbox 27, Asana 3) | 1                     |
| Fake or tutorial scopes                        | 0               | **10** (Dropbox 7, Asana 3)  | 1                     |
| Review gate correct                            | at least 3 of 4 | **0 of 4**                   | 2 of 6                |
| Approval wait correct                          | report          | 0 of 4                       | 1 of 6                |
| Milestone fields that are durations or Unknown | 100%            | 16 of 16                     | 24 of 24              |
| Top blocker is setup or approval               | report          | 1 of 4 (Dropbox fails)       | 4 of 6                |
| Apps with at least 2 real scopes               | report          | 2 of 4                       | 2 of 6                |
| Sourced claims on good pages                   | report          | 74% (61 of 82)               | 85%                   |
| Runs within 120 s / p95                        | 100% / 100 s    | 4 of 4 / 45.7 s              | 6 of 6 / 35.8 s       |
| Uncertain share                                | report          | 50%                          | 38%                   |
| Cost per run                                   | report          | $0.20                        | $0.21                 |

**What this says.**

- **Three of the four apps behaved like the tuning set on trust:** Asana, Calendly and Zoom cited no wrong-product page, 100% of their Sourced claims stood on the right product's pages, and none had a contradiction apart from Asana's three OpenID identity scopes (`openid`, `email`, `profile`), which the golden file counts as not Asana API scopes.
- **Dropbox failed completely, and the cause is in the first stage, not the later checks.** The resolve search ranked `hellosign.com` (the Dropbox Sign product, matched only by a page title: score 4.08) above `dropbox.com` (whose brand label is exactly "dropbox": score 3.97). The official domain became `hellosign.com`, the product phrase "Dropbox Sign API" was derived from its page titles, and every page read was another product's: 20 of 21 Sourced claims on another product's pages and the 7 scope names it listed were that product's. The later checks trust the identity they are given, so they could not catch it.
- **The review gate and wait are unknown for all four.** No gate or wait was verified on any holdout app.
- **Not met:** wrong-product 0, contradictions 0 and review gate at least 3 of 4. The tuning numbers overstate how well the system generalises; Dropbox is the counterexample, and it shows the same class of failure (a different product of the same company) that the tuning apps showed before Stage 1.
- **This is the pre-6b result.** Any change made after seeing it, including a fix for the Dropbox identity, is not tested by a clean holdout. A fresh holdout of apps not yet researched would be needed to claim generalisation again.

## 8. Not done, on purpose

- The model comparison (`gpt-4.1` against its recommended replacement `gpt-6-luna`): dropped to save credits. Both current models shut down on 2027-01-14, so a migration is still needed.
- First-pass pages 4 against 6: skipped (about 60 credits); the first pass still reads 4 pages and the retry up to 6.
- A labelled set of about 60 claims to score the support check: not built.
- Repeated runs (`--repeat 3`) after the baseline: only the baseline has them.
