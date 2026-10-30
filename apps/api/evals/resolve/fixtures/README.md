# Resolve stress fixtures

`stress-hits.json`: the hits every provider in `../providers.json` got in the stress run of 2026-10-30 (`evals/runs/2026-10-30T09-57-25Z-resolve`), snippets cut to 200 characters, with what Resolve did before the generic fixes (`before`). Test: `../stress-corpus.test.ts`, which pins the outcome of each provider after each fix. A second search is not replayed: it needs credits, so the confirming run waits for the Tavily reset.
