# Library plan: build the library from the saved Stage 5 guides

Status: **plan only, nothing built.** Costs **0 credits**: it reads six guides the Stage 5 tuning run already saved (`apps/api/evals/runs/2026-10-29T18-54-14Z/*.guide.json`, git-ignored) and writes no search or model call. Date of the facts below: 2026-10-30.

## 0. What I need from you

| #   | Decision                                                           | Why it needs you                                                                                                                                    | My recommendation                                                                                             |
| --- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| L1  | Gmail and Microsoft fail the seed check (section 2)                | You named six apps; the data supports four today. AGENTS.md says to ask before changing a provider fact in a library guide, so I will not edit them | Seed GitHub, HubSpot, Notion, Slack now. Hold Gmail and Microsoft for a re-run after 1 Nov (about 24 credits) |
| L2  | Library bar: no Sourced claim may rest only on a non-official page | Stricter than live guides, where a third-party Sourced claim is allowed and shown with its tier                                                     | Yes. The library is the first thing a reviewer reads                                                          |
| L3  | List "Not rated" guides after rated ones, in both sort directions  | Today the list sorts by the stored lower bound, so an unrated GitHub (stored 2) is listed as the easiest app                                        | Yes (section 4)                                                                                               |
| L4  | Who seeds                                                          | `db:seed` writes to a database. Deploys are yours, and I never read `.env`                                                                          | You run `db:seed`. I run only `--dry-run`, which opens no database                                            |
| L5  | Refresh the saved guides after 1 Nov with the PR 6b identity fixes | They predate "Researched as", the name guard and the tiering fix, and carry no `product`. About 11 credits an app                                   | Not now. Offer it after the credits reset                                                                     |

## 1. What the six saved guides are

All six pass `GuideSchema`, are `coverage: full`, `mode: live`, `asOf` 2026-10-29, and have no `product` field. Numbers come from the files; gate and wait correctness from the run's own scorecard.

| App       | Shown as         | Stored difficulty | Claims | Sourced | Uncertain | Sourced, no official source | Scopes | Gate (golden)              | Wait (golden)       |
| --------- | ---------------- | ----------------- | ------ | ------- | --------- | --------------------------- | ------ | -------------------------- | ------------------- |
| GitHub    | Not rated        | 2                 | 58     | 42      | 16 (28%)  | 0                           | 35     | unknown                    | unknown             |
| Gmail     | Not rated        | 3                 | 57     | 36      | 21 (37%)  | **22** (one personal blog)  | 0      | unknown                    | unknown             |
| HubSpot   | Hidden limits, 5 | 5                 | 34     | 20      | 14 (41%)  | 0                           | 8      | `required_to_scale`, match | 1 to 60 days, match |
| Microsoft | Not rated        | 2                 | 23     | 11      | 12 (52%)  | 0                           | 4      | unknown                    | unknown             |
| Notion    | Not rated        | 2                 | 28     | 17      | 11 (39%)  | 0                           | 0      | unknown                    | unknown             |
| Slack     | Hidden limits, 3 | 3                 | 35     | 25      | 10 (29%)  | 0                           | 1      | `optional_listing`, match  | unknown             |

**Read honestly**

- **Good:** no wrong-product source, no contradiction with the golden set in five of six, every source has `retrievedAt`, and for GitHub, HubSpot, Microsoft, Notion and Slack every Sourced claim stands on an official page.
- **Thin:** every first-test and production time is "Not found in the fetched sources" except Gmail's production time, which is Uncertain (a blog says "2 to 3 days"). So all six first-test cells and five of six production cells read "Not stated". Four of six read "Not rated". Two have no scopes (Gmail, Notion).
- **Gmail:** 22 of its 36 Sourced claims (its blockers and requirements) stand on `singhamandeep.com`, a personal blog. Its summary and one conflict cite Google's Workspace Marketplace app-review page, which is a different review from the restricted-scope verification Gmail apps need. Gmail was the app the library existed to show ("review needed"), and it is the weakest guide.
- **Microsoft:** the scope list holds `/.default`, a URL fragment (the scorecard's one fake scope). The scope check that rejects it was added after this run, so the saved file predates it. `AccessReview.Read.All` is a real Graph permission from an access-review page and is not this app's setup scope; no code rule can tell, so it needs your eye.
- The library premise "one app per kind of hard" no longer holds: the saved set has two `hidden_limits` guides and four with no verified gate. See the decision record, D26 in `docs/design-decisions.md`.

## 2. The seed check (code, generic, no app names)

One pure function, `checkLibraryGuide(guide)`, returns findings. The exporter and the seed both call it, and a test calls it on every committed library file. **The exporter never edits a guide:** it copies a guide that passes and refuses one that does not, naming the rule and the claim id. This keeps "only code sets labels" and avoids renumbering claim ids.

| Rule | Checks                                                                                                                                                | Today's six                                 |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| R1   | Parses with `GuideSchema`; slug in the file name; `asOf` is a valid date                                                                              | all pass                                    |
| R2   | `coverage` is `full` (a partial guide is not a library guide)                                                                                         | all pass                                    |
| R3   | Every Sourced or Tested claim has at least one `official` source (L2)                                                                                 | **Gmail fails (22 claims)**                 |
| R4   | Every scope name passes the name rules of `isRealScope`: not a placeholder, not unfinished or a URL fragment, not a bare host, not from an admin page | **Microsoft fails (`/.default`)**           |
| R5   | Every source URL is `https`; every Sourced or Tested claim has a non-empty quote                                                                      | all pass (the schema already needs a quote) |
| R6   | Informational, never fails: archetype `unknown` ("Not rated"), Uncertain share, scopes empty                                                          | printed for your review                     |

The check cannot re-run the quote check: the saved runs keep no page text, so quotes were proven at save time, not again here. `isRealScope` also needs page text, so the plan splits out its name-only part (`looksLikeScopeName(name, sourceUrl)`), which `isRealScope` then calls. Behaviour of the live pipeline does not change.

## 3. Tooling

| Piece                  | File (new unless noted)                                              | What it does                                                                                                                                                                                                                                                                                                                                                   |
| ---------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Check                  | `apps/api/src/library/check-guide.ts`                                | R1 to R6 above, pure                                                                                                                                                                                                                                                                                                                                           |
| Scope name rules       | `apps/api/src/agent/extract/scope-checks.ts` (edit)                  | Export `looksLikeScopeName`; `isRealScope` keeps its signature                                                                                                                                                                                                                                                                                                 |
| Export                 | `apps/api/src/library/export-guides.ts`, `scripts/library-export.ts` | `pnpm --filter api library:export -- <run folder> --apps github,hubspot,notion,slack` reads `<slug>.guide.json`, parses, sets `mode: "library"`, checks, writes `apps/api/library/<slug>.json` (stable key order, trailing newline). Prints one line per app with its findings. Exit code 1 if any selected app fails. No network, no model, no database       |
| Columns helper         | `apps/api/src/services/guide-columns.ts`                             | `toGuideColumns(guide, mode, expiresAt)`: the indexed columns and `data`. `saveLiveGuide` and the seed both use it (rule 6: second use)                                                                                                                                                                                                                        |
| Seed                   | `apps/api/src/services/library-seed.ts`, `scripts/db-seed.ts`        | `pnpm --filter api db:seed` loads `apps/api/library/*.json`, re-checks each, upserts by slug with `mode: LIBRARY`, `expiresAt: null`, `asOf` from the file. Safe to run twice (`database.mdc`). It replaces a live row with the same slug (the library wins) and says so. It never deletes. `--dry-run` validates and prints the plan without importing Prisma |
| Scripts                | `apps/api/package.json` (edit)                                       | `library:export`, `db:seed` (AGENTS.md already lists `db:seed`; it does not exist yet)                                                                                                                                                                                                                                                                         |
| Data and review record | `apps/api/library/<slug>.json`, `apps/api/library/REVIEW.md`         | The committed source of truth ("seeded from JSON files", `db-schema-design.md`). `REVIEW.md` records per app: source run, `asOf`, check result, and the lines you confirm by hand                                                                                                                                                                              |

Secrets: the guides hold public-docs URLs and short quotes only; `.env` is never read by the export, and the seed reads `DATABASE_URL` through the existing config, run by you.

**Tests (all without a network or a database):** each rule broken once gives its finding and a valid guide gives none; the exporter refuses a failing guide and writes nothing, and writes identical bytes when run twice; `mode` is `library` in the output; `looksLikeScopeName` table (placeholder, `/.default`, bare host, admin URL, real names) and `isRealScope` unchanged; the seed upserts once per file with `LIBRARY` and `expiresAt: null`, twice gives the same calls, and replaces a live row (Prisma mocked as in `guide-save.test.ts`); `--dry-run` does not load Prisma; one test parses and checks every committed `apps/api/library/*.json`.

## 4. What changes in the web app and the API

| Change                               | Where                                                        | Why                                                                                                                                                                                     |
| ------------------------------------ | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unrated guides sort after rated ones | `apps/web/src/utils/sort-guides.ts` and its test             | Sorting by the stored lower bound would list "Not rated" GitHub and Notion above HubSpot as "easiest". Ties and the unrated group stay alphabetical, in either direction                |
| App marks for the new slugs          | `utils/library-app-slug.ts`, `components/shared/AppIcon.tsx` | The slug union lists five apps and the two to drop. Add Notion and Slack marks (Simple Icons, CC0). Microsoft has none, and `AppIcon` already renders nothing for a slug without a mark |
| Library description                  | `components/app-home/LibrarySection.tsx`                     | "A fixed rule sets the difficulty score" is untrue for a Not rated guide                                                                                                                |
| API order note                       | `docs/api-design.md` line 129                                | The API still returns stored difficulty ascending; the web re-sorts. No code change, no schema change                                                                                   |

Already fine, checked in the code: a Not rated row (`LibraryTableRow` uses `isRated`), an unknown time (`LibraryTimeCell` shows "Not stated" with the Uncertain label), and the landing sample (`LandingPage.tsx` uses `hubspot`, the best of the six). A library slug is always a cache hit, even for `force` (`services/runs.ts`), so typing Notion, Slack or GitHub returns the saved guide, not a new run. That is the intended speed, and it means these saved guides are what a reviewer sees for those apps.

## 5. The LinkedIn and Salesforce drop (decision D26)

**Change** (these describe the library):

| File                                                                      | Line(s)     | Edit                                                                                         |
| ------------------------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------- |
| `README.md`                                                               | 55 to 56    | Library table lists the guides actually seeded                                               |
| `docs/solution.md`                                                        | 45          | "5 hand-checked guides" becomes the real list and "researched by the agent, checked by code" |
| `docs/features.md`                                                        | 61          | M6 row                                                                                       |
| `docs/design-decisions.md`                                                | 38, 106     | Row 5 and D5 get "Superseded by D26" (D26 is added in this PR)                               |
| `docs/product-architecture.md`                                            | 24, 47, 146 | "5 curated JSON files", "Curated and reviewed" become the real count and wording             |
| `docs/db-schema-design.md`                                                | 148         | "Re-seed after editing a library file" becomes "re-export, re-check, re-seed"                |
| `AGENTS.md`                                                               | 55          | Add `library:export` beside `db:seed`                                                        |
| `apps/web/src/utils/library-app-slug.ts`, `components/shared/AppIcon.tsx` | -           | Remove the two marks (section 4)                                                             |
| `apps/web/src/utils/sort-guides.test.ts`                                  | 16 to 27    | Sample names only; swap Salesforce for a library app                                         |

**Keep** (they are not library claims): `docs/problem.md` 17, 72 to 75, 86 to 87 (the problem research, with sources), `docs/design-decisions.md` 287 and `README.md` 194 (a sourced finding and an evidence-label example), the "How we verify" conflict example (`content/verify-examples.ts`, `ConflictsSection.tsx`: a worked example of an official page beating a third-party guide, not a guide), and `apps/api/src/agent/resolve/denylist.ts` `linkedin.com` (the social-site denylist for domain resolution, unrelated).

## 6. Order of work (four small PRs, each with lint, check-types, build and test green)

1. `feat/library-tooling`: check, scope-rule split, columns helper, export, seed, scripts, tests. No data.
2. `feat/library-guides`: `apps/api/library/*.json` for the apps that pass, `REVIEW.md`, the guard test. **Your review point:** the content you confirm by hand is here.
3. `fix/library-web`: sort, marks, description, tests. Checked in the preview against the stub API on :3001 with the exported files as its guides.
4. `docs/library-six`: the docs in section 5, D25's last sentence ("the library, whose guides are reviewed, is unaffected") rewritten, README "Next steps".

## 7. What this does not do

- It does not check a single provider fact against its page. R3 and R4 are structure; the facts were checked by the run's quote check on 2026-10-29. Your hand review (a few Sourced claims per guide, opened from their source links) is the only check on meaning.
- It does not seed anything. I never run `db:seed` against a database and never read `.env`.
- It does not re-run the agent. The saved guides keep the Stage 5 behaviour and have no "Researched as" line.
- Seeding against a real MySQL is untested by me; the unit tests mock Prisma, as the existing `guide-save` tests do.
