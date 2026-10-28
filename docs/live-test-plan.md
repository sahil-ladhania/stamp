# Live test plan

## TL;DR

- Five hand-run tests of the real agent with real keys: HubSpot, Notion, an ambiguous name, an API-key app, and a forced timeout.
- Each test says what to check in the SSE stream, in the saved guide and in the API log, and what to paste back.
- Nothing here needs code changes. Thresholds, keywords and the probe patterns are first guesses; this is where they get tuned.

---

## 1. Before you start

1. `apps/api/.env` needs `DATABASE_URL`, `OPENAI_API_KEY`, `OPENAI_MODEL_FAST`, `OPENAI_MODEL_STRONG`, `TAVILY_API_KEY`, `WEB_ORIGIN`, `DAILY_RUN_CAP` (10 or more) and `AGENT_MODE=real`. The probe is on unless `AGENT_PROBE=off`.
2. Migrate once: `pnpm --filter api db:migrate`.
3. Start the API and keep its log. Info goes to stdout, warnings and errors to stderr, so join them:

```bash
pnpm --filter api dev 2>&1 | tee api.log
```

4. In another terminal, load these helpers (they need `curl` and `jq`):

```bash
API=http://localhost:3000

# Start a run (force skips the guide cache), follow its stream into <tag>.sse, print the run id.
run_app() {
  local res id
  res=$(curl -s -X POST $API/api/runs -H 'content-type: application/json' -d "{\"app\":\"$1\",\"force\":true}")
  echo "$res"
  id=$(echo "$res" | jq -r '.runId // empty')
  [ -n "$id" ] && curl -sN $API/api/runs/$id/stream > "$2.sse" && echo "finished: $id"
}

events()   { grep '^data:' "$1" | sed 's/^data: //'; }                       # events <tag>.sse
timeline() { events "$1" | jq -r 'if .type=="stage.started" then "--- stage \(.stage) \(.name)" else .type end' | uniq -c; }
timings()  { events "$1" | jq -r 'select(.type=="stage.done") | "stage \(.stage): \(.durationMs) ms"'; }
logs()     { grep '^{' api.log | jq -c "select(.runId==\"$1\")"; }             # logs <runId>
labels()   { jq '[.. | objects | select(has("label") and has("sources")) | .label] | group_by(.) | map({(.[0]): length}) | add' "$1"; }
unknowns() { jq -r '.. | objects | select(.label=="uncertain" and (.sources|length)==0) | "\(.id): \(.text)"' "$1"; }
quotes()   { jq -r '.. | objects | select(has("quote")) | "\(.tier)  \(.url)\n    \(.quote)"' "$1"; }
```

5. To make a run fetch fresh pages instead of the 7-day cache, empty the cache table: `DELETE FROM page_cache;`. Leave it alone when a test is about cache hits.

What the stream should always look like (details per test below): `run.snapshot` first; then, in order, `stage.started` / `stage.done` pairs for stages 0 to 8; `search.query`, `page.fetched`, `claim.verified` and `claim.downgraded` between them; `run.done` or `run.error` last. A failing stage emits `stage.started` but no `stage.done`.

Stage time caps to compare against (`stage.done` `durationMs`): resolve 6 s, plan 6 s, search 8 s, fetch 12 s, extract 40 s, verify 2 s, probe 4 s, score 1 s, save 5 s. The first pass is 84 s in total, the whole run 120 s.

---

## 2. The five tests

### Test 1: HubSpot (known content)

```bash
run_app "HubSpot" hubspot
curl -s $API/api/guides/hubspot > hubspot.json
```

| Where | Check |
| --- | --- |
| Stream | Ends with `run.done` `done` (`partial` is possible if a section timed out; note which). `timeline hubspot.sse` shows stages 0 to 8 in order, each started and done. 7 `search.query` events for a typed name (1 from resolve, 6 from search); a retry adds 1 to 2 more. Up to 4 `page.fetched` on the first pass, official ones first. `claim.verified` events far outnumber `claim.downgraded`. No `claim.*` event after `--- stage 6`. `timings` stay under the caps above. |
| Guide | `jq '{archetype,difficulty,coverage,difficultyBreakdown,verdict}' hubspot.json`: `coverage` is `full`; the breakdown adds up; `nextStepId` and `topBlockerId` point at real steps and blockers. Walk the steps against what you know: create a developer account and app, client ID and secret, redirect URL, scopes, authorize and token calls. Then the review gate, install or listing limits and rate limits. `labels hubspot.json`: mostly `sourced`, `tested` for any step that quotes the authorize URL. `unknowns hubspot.json`: every one should be honest ("Not found..."), and the milestone and step effort/wait claims should be uncertain. `quotes hubspot.json`: open five source URLs and confirm each quote is on the page. |
| Log | `logs <runId>`: one `resolve summary` with `decision: official` and the HubSpot domain first. `verify summary`: `sourced` high, `missing` empty. `probe summary`: the authorize URL it picked (likely on `app.hubspot.com` if the docs quote it) and the outcome and status. `run summary`: `durationMs`, `totalTokens`, `tavilySearchCalls`, `pagesFetched`, `labels`. No `error` lines. |
| Paste back | `run summary`, `probe summary`, `labels hubspot.json`, `unknowns hubspot.json`, anything you know is wrong or missing in the guide. |

### Test 2: Notion (a new app: nothing cached, nothing in the library)

```bash
run_app "Notion" notion
curl -s $API/api/guides/notion > notion.json
run_app "Notion" notion2        # same app again: pages now come from the cache
```

| Where | Check |
| --- | --- |
| Stream | Same shape as test 1. Run 2 has the same stages but a faster fetch. |
| Guide | Same checks as test 1. Look at the tiers in `quotes notion.json`: the docs are on one official domain; pages on the app's other domain (for example a marketing or help site) may count as third party. Check that nothing stated in the guide is wrong because of that. Where the docs are silent the guide should say so (`unknowns`), not guess. |
| Log | Run 1: `run summary` has `pagesFetched` above 0 and `pageCacheHits` 0. Run 2: `pageCacheHits` above 0 and fewer or no `tavilyExtractCalls`. `resolve summary` for "Notion": check the winning domain and the runner-up scores. `search summary`: `byTier` has official results. `probe summary`: the picked URL (likely `api.notion.com/v1/oauth/authorize` if quoted). |
| Paste back | Both `run summary` lines, `resolve summary`, `search summary`, `probe summary`, and what is missing from the guide. |

### Test 3: An ambiguous name

Try `Mercury` first, then `Apollo`.

```bash
run_app "Mercury" mercury
curl -s $API/api/runs/<runId> | jq
```

| Where | Check |
| --- | --- |
| Stream | `run.snapshot`, `stage.started` 0, one `search.query`, then `run.error` with `code: AMBIGUOUS_APP`, `stage: 0` and 2 to 3 `options` of `{name, domain}`. No stage 1 or later. |
| API | `GET /api/runs/<id>`: `status: failed`, `errorCode: AMBIGUOUS_APP`. `SELECT activeSlug FROM runs ORDER BY startedAt DESC LIMIT 1;` is NULL (the lock is freed). No guide row for the slug. |
| Log | One `resolve summary` with `decision: ambiguous` and the candidates with their scores. `run summary`: `ok: false`, `code: AMBIGUOUS_APP`, `tavilySearchCalls: 1`, zero model calls. |
| If it does not stop | The name resolved to one app, or to `none`. Paste the `resolve summary` line: the candidate scores are what the thresholds (`ambiguityRatio` 0.6, `maxOptions` 3) are tuned against. Also try a name you know is shared. |
| Paste back | The `run.error` line, `resolve summary`, and whether the options were the apps you expected. |

### Test 4: An app that uses API keys, not OAuth

Try `Postmark`, or `SendGrid`, or `OpenAI`.

```bash
run_app "Postmark" postmark
```

| Where | Check |
| --- | --- |
| Stream | Stages 0 to 3 done, `stage.started` 4, then `run.error` with `code: NOT_OAUTH`, `stage: 4`. No stage 5 or later. |
| API | Run `failed`, `errorCode: NOT_OAUTH`. No guide row. |
| Log | `extract summary`: a row per section with `status` and `durationMs`; the steps and scopes rows should be `unknown`. `run summary`: `ok: false`, `code: NOT_OAUTH`, a few `strongCalls`. |
| If it does not stop | A guide, `NO_PUBLIC_DOCS` or `INTERNAL` came out instead. `NOT_OAUTH` needs the docs to say API keys only, word for word on an official page, and no OAuth steps or scopes found. If the docs mention OAuth anywhere, a guide is the right answer. Paste the `extract summary` rows either way. |
| Paste back | The `run.error` line (or the guide's `archetype` and `difficultyBreakdown`), and `extract summary`. |

### Test 5: Forced timeout

The budget can only be lowered (`AGENT_RUN_BUDGET_MS`, at most 120000). Extract needs 20 s left to start, so the budget decides the result. Find your number from a normal run first: from test 1 or 2, add up `timings` for stages 0 to 3, call it T.

| Case | Budget | Expected |
| --- | --- | --- |
| Partial guide | about T + 25 s (try 35000 first) | Extract starts but its window is short, so some sections run out of time. |
| Stops before extract | about T + 5 s (try 20000) | Extract never starts: no drafts, no claims. |

```bash
# restart the API with the lower budget (Ctrl-C the old one first)
AGENT_RUN_BUDGET_MS=35000 pnpm --filter api dev 2>&1 | tee api.log
run_app "HubSpot" timeout
curl -s $API/api/guides/hubspot > timeout.json
```

| Where | Check |
| --- | --- |
| Partial: stream | `run.done` with `status: partial`. Stages 0 to 5, 7 and 8 are present; 6 may be missing (under 3 s left). The run ends within the budget plus a few seconds, and always inside 135 s. There are no `claim.downgraded` events with reason `time_budget`: time-outs show up as unknown claims in the guide. |
| Partial: guide | `coverage: partial`. `unknowns timeout.json` lists claims saying "Not researched before the time budget ran out." for the sections that did not finish, and whole sections empty (requirements and limits hold one such claim each). Every claim that is `sourced` still has a quote that is on its page. Score and archetype are present (a missing wait counts 2). |
| Partial: log | `extract summary` rows with `status` failed and `reason: time_budget`; `run summary` with `coverage: partial`, `labels` mostly `uncertain` for the missing parts. |
| Early stop: stream | `run.error` with `code: INTERNAL`, `stage: 8`, after `stage.done` 7. By design nothing is published when no claim was verified. Check this is the result you want users to see. |
| Early stop: log | An `error` line `guide not saved` with `reason: no sourced claim`; `run summary` with `ok: false`, `claims: 0`. |
| Either | Lock freed (`activeSlug` NULL), so a second run of the same app starts at once. Restart the API without the variable afterwards. |
| Paste back | The `run.done` / `run.error` line, `timings`, `run summary`, `unknowns timeout.json`, and the budget you used. |

---

## 3. When something looks wrong

Paste back, for the run in question:

1. The `run summary` line, and any `warn` or `error` line: `logs <runId> | jq -c 'select(.level != "info")'`.
2. The SSE file (`<tag>.sse`) and the guide JSON.
3. What you expected instead, with the page URL that shows it.

Do not paste `.env`, keys or database URLs.

---

## Next

- See [agent-architecture.md](./agent-architecture.md) section 11 for every log line and its fields.
