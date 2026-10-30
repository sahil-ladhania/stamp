# Scorecard: tuning

Generated 2026-10-29T18:55:46.238Z. Runs: 6.

On good pages: Sourced claims on the right product's official pages, over all Sourced claims. Golden pages: read / found by the search / cited in the golden file.

| App | Status | Time (s) | In 120 s | Pages | Retries | Wrong-product | Gate | Wait | Real scopes | Fake scopes | Durations | Top blocker | Contradictions | Coverage | Uncertain | On good pages | Golden pages | Tokens | Credits | Cost |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| github | done | 32.4 | yes | 6 | 1 | 0 | unknown | unknown | 5/35 | 0 | 4/4 | pass | 0 | 3/5 | 28% | 42/42 | 1/3/5 | 49206 | 11 | $0.20 |
| gmail | done | 34.7 | yes | 6 | 1 | 0 | unknown | unknown | 0/0 | 0 | 4/4 | pass | 0 | 2/5 | 37% | 13/36 | 1/3/6 | 50941 | 11 | $0.20 |
| hubspot | done | 22.9 | yes | 6 | 1 | 0 | match (required_to_scale) | match (1 to 60 days) | 3/8 | 0 | 4/4 | pass | 0 | 5/5 | 41% | 20/20 | 2/3/7 | 42576 | 11 | $0.18 |
| microsoft | done | 20.9 | yes | 6 | 1 | 0 | unknown | unknown | 1/4 | 1 | 4/4 | none | 1 | 2/5 | 52% | 11/11 | 1/2/7 | 46469 | 13 | $0.20 |
| notion | done | 35.8 | yes | 6 | 1 | 0 | unknown | unknown | 0/0 | 0 | 4/4 | none | 0 | 1/5 | 39% | 17/17 | 0/2/2 | 55943 | 13 | $0.24 |
| slack | done | 31.1 | yes | 6 | 1 | 0 | match (optional_listing) | unknown | 1/1 | 0 | 4/4 | pass | 0 | 4/5 | 29% | 25/25 | 2/3/5 | 53358 | 12 | $0.22 |
| **Total** | 6/6 ended | p95 35.8 | 6/6 | 36 | 6 | 0 | 2/6 match | 1/6 match | 2/6 apps with 2+ | 1 | 24/24 | 4 pass, 0 manual, 0 fail | 1 | 17/30 | 38% | 128/151 | 7/16/32 | 298493 | 71 | $1.25 |

## Success metrics

| Metric | Target | Result |
| --- | --- | --- |
| Wrong-product sources | 0 | 0 |
| Sourced claims that contradict the golden set | 0 | 1 |
| Review gate correct | at least 5 of 6 | 2 of 6 |
| Apps with at least 2 real scopes | at least 5 of 6 | 2 of 6 |
| Fake or tutorial scopes | 0 | 1 |
| Milestone fields that are durations or Unknown | 100% | 24 of 24 |
| Top blocker is a setup or approval blocker | at least 5 of 6 | 4 of 6 |
| Runs that end within 120 s | 100% | 6 of 6 |
| p95 run time | at most 100 s | 35.8 s |
| Uncertain share | report | 38% |
| Cost per run | report | $0.21 |
| Sourced claims on good pages | report (stage 3 target: at least 95%) | 85% |
| Golden pages read | report | 7 of 32 |
| Golden pages found by the search | report | 16 of 32 |

## Needs a manual look

- github: scopes not in the golden list: repo:status, repo_deployment, public_repo, repo:invite, security_events, admin:repo_hook, write:repo_hook, read:repo_hook, admin:org, write:org, admin:public_key, write:public_key, read:public_key, admin:org_hook, notifications, read:user, user:email, user:follow, project, read:project, delete_repo, write:packages, read:packages, delete:packages, admin:gpg_key, write:gpg_key, read:gpg_key, codespace, read:audit_log, offline_access
- gmail: official pages outside the golden path hints: https://developers.google.com/workspace/marketplace/about-app-review
- gmail: pages from other domains cited: https://singhamandeep.com/google-oauth-verification-guide
- hubspot: scopes not in the golden list: developer.webhooks_journal.read, developer.webhooks_journal.subscriptions.read, developer.webhooks_journal.subscriptions.write, developer.webhooks_journal.snapshots.read, developer.webhooks_journal.snapshots.write
- microsoft: scopes not in the golden list: User.Read.All, AccessReview.Read.All
- slack: official pages outside the golden path hints: https://docs.slack.dev/tools/node-slack-sdk/oauth
