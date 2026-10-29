# Evals

Measures whether Stamp's guides can be trusted. It runs the real agent in-process on the golden apps and scores each guide with deterministic checks.

## Run it

```bash
pnpm --filter api eval -- --set tuning
```

That prints the cost estimate and stops. It makes no calls and spends nothing. To run the batch, add `--confirm`.

| Option                                | What it does                                                             |
| ------------------------------------- | ------------------------------------------------------------------------ |
| `--set tuning` / `holdout` / `<slug>` | Which apps to run. Tuning is 6 apps, holdout is 4                        |
| `--confirm`                           | Actually runs the batch. Without it, only the estimate is printed        |
| `--parallel 1\|2`                     | Runs at a time. Default and maximum is 2                                 |
| `--allow-holdout`                     | Needed for any holdout app. Run the holdout set once, after the last fix |
| `--out <dir>`                         | Output folder. Default is `evals/runs/<timestamp>/`                      |

Limits: at most 12 runs per batch, at most 2 in parallel.

## What a run does and does not touch

- Uses the real OpenAI and Tavily clients, so it costs money. Keys come from `apps/api/.env`, which the process loads itself.
- Fetches every page fresh. The database page cache is not read or written, so credits and time are comparable between runs.
- Saves no guide and writes no verification log. Stored guides are never overwritten.

## Output

Each run writes to `evals/runs/<timestamp>/` (git-ignored; add one by hand with `git add -f` when a PR needs it).

| File                | Holds                                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------------------------ |
| `scorecard.md`      | One row per app, one column per metric, a totals row, the success-metric table, and what needs a manual look |
| `<slug>.guide.json` | The guide the run produced, or `null`                                                                        |
| `<slug>.trace.json` | Every stage event with its time offset, and the run's log lines                                              |
| `<slug>.score.json` | The scores, plus the run's outcome, gates, pages, usage and models                                           |
| `meta.json`         | The set, apps, parallel limit and times. No settings                                                         |

## How scoring works

- `golden/` holds the hand-researched answers. See its README.
- `scoring/` holds the pure checks, one file each: wrong-product sources, review gate and wait, scopes, duration shape, top blocker, coverage and contradictions.
- A Sourced or Tested fact that contradicts the golden set is a contradiction. An Uncertain claim or an unknown fact never is.
- Anything the rules cannot settle (an unlisted scope, a top blocker with no golden keyword, a cited page off the golden path hints) goes to "Needs a manual look".
- `pricing.json` holds the prices, each with its official source. A model with no listed price gives a cost of n/a, never a guess.
