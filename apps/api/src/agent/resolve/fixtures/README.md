# Resolve fixtures

- `baseline-hits.ts`: the six tuning apps' resolve hits from the first clean baseline repetition (2026-10-29).
- `tuning-resolve-hits.json`: every distinct list of resolve hits the six **tuning** apps got in the saved tuning eval runs of 2026-10-29 (16 lists, 8 hits each, URL and title only), with the answer Resolve gave on them before the generic fixes of 2026-10-30 (`answer`). Test: `tuning-corpus.test.ts`. A change to Resolve must leave every `answer` unchanged. No holdout or fresh app is in it.
