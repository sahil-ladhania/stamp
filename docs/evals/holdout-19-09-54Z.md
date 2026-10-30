# Scorecard: holdout

Generated 2026-10-29T19:11:14.121Z. Runs: 4.

On good pages: Sourced claims on the right product's official pages, over all Sourced claims. Golden pages: read / found by the search / cited in the golden file.

| App | Status | Time (s) | In 120 s | Pages | Retries | Wrong-product | Gate | Wait | Real scopes | Fake scopes | Durations | Top blocker | Contradictions | Coverage | Uncertain | On good pages | Golden pages | Tokens | Credits | Cost |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| asana | done | 40.7 | yes | 6 | 1 | 0 | unknown | unknown | 5/39 | 3 | 4/4 | pass | 3 | 3/5 | 69% | 20/20 | 1/1/3 | 46633 | 11 | $0.21 |
| calendly | done | 45.7 | yes | 6 | 1 | 0 | unknown | unknown | 5/23 | 0 | 4/4 | none | 0 | 2/5 | 33% | 31/31 | 2/2/2 | 52979 | 13 | $0.22 |
| dropbox | done | 31.3 | yes | 6 | 1 | 3 | unknown | unknown | 0/7 | 7 | 4/4 | fail | 27 | 3/5 | 34% | 0/21 | 0/0/4 | 39423 | 12 | $0.18 |
| zoom | done | 33.8 | yes | 6 | 1 | 0 | unknown | unknown | 0/8 | 0 | 4/4 | none | 0 | 2/5 | 66% | 10/10 | 4/4/6 | 46202 | 11 | $0.19 |
| **Total** | 4/4 ended | p95 45.7 | 4/4 | 24 | 4 | 3 | 0/4 match | 0/4 match | 2/4 apps with 2+ | 10 | 16/16 | 1 pass, 0 manual, 1 fail | 30 | 10/20 | 50% | 61/82 | 7/7/15 | 185237 | 47 | $0.80 |

## Success metrics

| Metric | Target | Result |
| --- | --- | --- |
| Wrong-product sources | 0 | 3 |
| Sourced claims that contradict the golden set | 0 | 30 |
| Review gate correct | at least 3 of 4 | 0 of 4 |
| Apps with at least 2 real scopes | n/a for this selection | 2 of 4 |
| Fake or tutorial scopes | 0 | 10 |
| Milestone fields that are durations or Unknown | 100% | 16 of 16 |
| Top blocker is a setup or approval blocker | n/a for this selection | 1 of 4 |
| Runs that end within 120 s | 100% | 4 of 4 |
| p95 run time | at most 100 s | 45.7 s |
| Uncertain share | report | 50% |
| Cost per run | report | $0.20 |
| Sourced claims on good pages | report (stage 3 target: at least 95%) | 74% |
| Golden pages read | report | 7 of 15 |
| Golden pages found by the search | report | 7 of 15 |

## Needs a manual look

- asana: scopes not in the golden list: attachments:delete, attachments:read, attachments:write, custom_fields:read, custom_fields:write, custom_types:read, goals:read, jobs:read, notifications:read, notifications:write, ooo_entries:delete, ooo_entries:read, ooo_entries:write, portfolios:read, portfolios:write, project_portfolio_settings:read, project_portfolio_settings:write, project_templates:read, projects:delete, roles:delete, roles:read, roles:write, stories:read, stories:write, tags:read, tags:write, task_templates:read, tasks:delete, webhooks:delete, webhooks:read, webhooks:write
- calendly: scopes not in the golden list: availability:read, availability:write, event_types:write, locations:read, routing_forms:read, shares:write, scheduled_events:write, groups:read, organizations:read, organizations:write, webhooks:read, activity_log:read, data_compliance:write, outgoing_communications:read, contacts:read, contacts:write, meeting_recaps:read, meeting_recaps:write
- dropbox: official pages outside the golden path hints: https://help.dropbox.com/integrations/how-to-get-app-approval-for-dropbox-sign-api
- zoom: scopes not in the golden list: user:read:admin, email:write:untrash_msg, email:write:msg, email:read:msg, docs:write:file, docs:read:file, video_mgmt:read:list_channels, zoom_events:read:list_events
- zoom: official pages outside the golden path hints: https://developers.zoom.us/docs/internal-apps/s2s-oauth
